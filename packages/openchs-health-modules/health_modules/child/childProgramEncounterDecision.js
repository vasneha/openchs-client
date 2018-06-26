import BirthFormHandler from "./formFilters/BirthFormHandler";
import ChildPNCFormHandler from "./formFilters/ChildPNCFormHandler";
import {FormElementsStatusHelper, complicationsBuilder as ComplicationsBuilder, RuleFactory} from "rules-config/rules";
import _ from "lodash";
import {immediateReferralAdvice, referralAdvice} from "./referral";
import generateHighRiskConditionAdvice from "./highRisk";
import {getDecisions as anthropometricDecisions} from "./anthropometricDecision"

const ChildPNC = RuleFactory("e09dddeb-ed72-40c4-ae8d-112d8893f18b", "Decision");
const Birth = RuleFactory("901e2f48-2fb8-402b-9073-ee2fac33fce4", "Decision");
const Anthro = RuleFactory("d062907a-690c-44ca-b699-f8b2f688b075", "Decision");

@ChildPNC("b090eb6d-0acb-4089-8ec0-9fbd63117010", "All Child PNC Encounter Decisions", 1.0, {})
class ChildPNCDecisions {
    static exec(programEncounter, decisions, context, today) {
        return getDecisions(programEncounter, today);
    }
}

@Birth("ddcc027e-68d0-473c-ab0e-92d7596d2dc1", "All Birth Encounter Decisions", 1.0, {})
class BirthDecisions {
    static exec(programEncounter, decisions, context, today) {
        return getDecisions(programEncounter, today);
    }
}

@Anthro("151302cb-f040-403a-8b1a-6c56ed7ecf04", "All Anthro Encounter Decisions", 1.0, {})
class AnthroDecisions {
    static exec(programEncounter, decisions, context, today) {
        return getDecisions(programEncounter, today);
    }
}


export function getDecisions(programEncounter, today) {
    if (programEncounter.encounterType.name === 'Birth' || programEncounter.encounterType.name === 'Child PNC') {
        let decisions = [
            recommendations(programEncounter.programEnrolment, programEncounter),
            immediateReferralAdvice(programEncounter.programEnrolment, programEncounter, today),
            referralAdvice(programEncounter.programEnrolment, programEncounter, today)
        ];

        let highRiskConditions = generateHighRiskConditionAdvice(programEncounter.programEnrolment, programEncounter, today);
        if (!_.isEmpty(highRiskConditions.value)) {
            decisions.push(highRiskConditions);
        }

        return {
            enrolmentDecisions: [],
            encounterDecisions: decisions.concat(anthropometricDecisions(programEncounter).encounterDecisions)
        }
    }
    else if (programEncounter.encounterType.name === 'Anthropometry Assessment') {
        return anthropometricDecisions(programEncounter);
    }
    else return {enrolmentDecisions: [], encounterDecisions: []};
}


const recommendations = (enrolment, encounter) => {
    const recommendationBuilder = new ComplicationsBuilder({
        programEnrolment: enrolment,
        programEncounter: encounter,
        complicationsConcept: 'Recommendations'
    });

    recommendationBuilder.addComplication("Keep the baby warm")
        .when.valueInEncounter("Child Pulse").lessThan(60)
        .or.when.valueInEncounter("Child Pulse").greaterThan(100)
        .or.when.valueInEncounter("Child Respiratory Rate").lessThan(30)
        .or.when.valueInEncounter("Child Respiratory Rate").greaterThan(60)
    ;

    recommendationBuilder.addComplication("Keep the baby warm by giving mother's skin to skin contact and covering the baby's head, hands and feet with a cap, gloves and socks resp.")
        .when.valueInEncounter("Child Temperature").lessThan(97.5)
    ;

    recommendationBuilder.addComplication("Give exclusive breast feeding")
        .when.valueInEncounter("Child Temperature").lessThan(97.5);

    recommendationBuilder.addComplication("Give exclusive breast feeding")
        .when.encounterType.equals("Child PNC")
        .and.valueInEncounter("Is baby exclusively breastfeeding").containsAnswerConceptName("No");

    return recommendationBuilder.getComplications();
};


const encounterTypeHandlerMap = new Map([
    ['Birth', new BirthFormHandler()],
    ['Child PNC', new ChildPNCFormHandler()]
]);

export function getFormElementsStatuses(programEncounter, formElementGroup, today) {
    let handler = encounterTypeHandlerMap.get(programEncounter.encounterType.name);
    return FormElementsStatusHelper.getFormElementsStatuses(handler, programEncounter, formElementGroup, today);
}