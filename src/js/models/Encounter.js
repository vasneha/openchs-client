import General from "../utility/General";
import EncounterType from "./EncounterType";
import Individual from "./Individual";
import ResourceUtil from "../utility/ResourceUtil";
import _ from "lodash";
import Observation from './Observation'
import Concept from './Concept'
import SingleCodedValue from './observation/SingleCodedValue';
import MultipleCodedValue from './observation/MultipleCodedValues';
import PrimitiveValue from "./observation/PrimitiveValue";
import moment from "moment";

class Encounter {
    static schema = {
        name: 'Encounter',
        primaryKey: 'uuid',
        properties: {
            uuid: 'string',
            encounterType: 'EncounterType',
            encounterDateTime: 'date',
            individual: 'Individual',
            observations: {type: 'list', objectType: 'Observation'}
        }
    };

    static create() {
        let encounter = new Encounter();
        encounter.observations = [];
        return encounter;
    }

    static fromResource(resource, entityService) {
        const encounterType = entityService.findByKey("uuid", ResourceUtil.getUUIDFor(resource, "encounterTypeUUID"), EncounterType.schema.name);
        const individual = entityService.findByKey("uuid", ResourceUtil.getUUIDFor(resource, "individualUUID"), Individual.schema.name);

        const encounter = General.assignFields(resource, new Encounter(), ["uuid"], ["encounterDateTime"], ["observations"], entityService);
        encounter.encounterType = encounterType;
        encounter.individual = individual;
        return encounter;
    }

    get toResource() {
        const resource = _.pick(this, ["uuid"]);
        resource["encounterTypeUUID"] = this.encounterType.uuid;
        resource["individualUUID"] = this.individual.uuid;
        resource.encounterDateTime = moment(this.encounterDateTime).format();
        resource["observations"] = [];
        this.observations.forEach((obs) => {
            var obsResource = {conceptUUID: obs.concept.uuid};
                if(obs.concept.datatype === Concept.dataType.Coded){
                    if(obs.valueJSON.constructor === SingleCodedValue){
                        obsResource.valueCoded = [obs.getValue().conceptUUID]
                    }else {
                        obsResource.valueCoded = obs.getValue().map((answer) => {return answer.conceptUUID});
                    }
                } else {
                    obsResource.valuePrimitive = obs.getValue();
                }
            resource["observations"].push(obsResource);
        });
        return resource;
    }

    toggleSingleSelectAnswer(concept, answerUUID) {
        return this.toggleCodedAnswer(concept, answerUUID, true);
    }

    toggleCodedAnswer(concept, answerUUID, isSingleSelect) {
        let observation = this.getObservation(concept);
        if (_.isEmpty(observation)) {
            observation = Observation.create(concept, isSingleSelect ? new SingleCodedValue(answerUUID) : new MultipleCodedValue().push(answerUUID));
            this.observations.push(observation);
            return observation;
        }
        else {
            isSingleSelect ? observation.toggleSingleSelectAnswer(answerUUID) : observation.toggleMultiSelectAnswer(answerUUID);
            if (observation.hasNoAnswer()) {
                _.remove(this.observations, (obs) => obs.concept.uuid === observation.concept.uuid);
            }
            return null;
        }
    }

    toggleMultiSelectAnswer(concept, answerUUID) {
        return this.toggleCodedAnswer(concept, answerUUID, false);
    }

    getObservation(concept) {
        return _.find(this.observations, (observation) => {
            return observation.concept.uuid === concept.uuid;
        });
    }

    addOrUpdatePrimitiveObs(concept, value) {
        const observation = this.getObservation(concept);
        if (_.isEmpty(observation) && !_.isEmpty(_.toString(value)))
            this.observations.push(Observation.create(concept, new PrimitiveValue(value)));
        else if (_.isEmpty(_.toString(value))) {
            _.remove(this.observations, (obs) => obs.concept.uuid === observation.concept.uuid);
        } else {
            observation.setPrimitiveAnswer(value);
        }
    }

    findObservation(concept) {
        return _.find(this.observations, (observation) => {
            return observation.concept.uuid === concept.uuid;
        });
    }

    cloneForNewEncounter() {
        const encounter = new Encounter();
        encounter.uuid = this.uuid;
        encounter.encounterType = _.isNil(this.encounterType) ? null : this.encounterType.clone();
        encounter.encounterDateTime = this.encounterDateTime;
        encounter.individual = _.isNil(this.individual) ? null : this.individual.cloneWithoutEncounters();
        encounter.observations = [];
        this.observations.forEach((observation) => {
            encounter.observations.push(observation.cloneForNewEncounter());
        });
        return encounter;
    }
}

export default Encounter;