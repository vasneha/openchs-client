import moment from "moment";
import ResourceUtil from "./utility/ResourceUtil";
import AddressLevel from "./AddressLevel";
import Gender from "./Gender";
import General from "./utility/General";
import BaseEntity from "./BaseEntity";
import ProgramEnrolment from "./ProgramEnrolment";
import IndividualRelationship from "./relationship/IndividualRelationship";
import Encounter from "./Encounter";
import Duration from "./Duration";
import _ from "lodash";
import ValidationResult from "./application/ValidationResult";
import ObservationsHolder from "./ObservationsHolder";

class Individual extends BaseEntity {
    static schema = {
        name: "Individual",
        primaryKey: 'uuid',
        properties: {
            uuid: "string",
            name: "string",
            firstName: "string",
            lastName: "string",
            dateOfBirth: "date",
            dateOfBirthVerified: "bool",
            gender: 'Gender',
            registrationDate: "date",
            lowestAddressLevel: 'AddressLevel',
            voided: {type: 'bool', default: false},
            enrolments: {type: "list", objectType: "ProgramEnrolment"},
            encounters: {type: "list", objectType: "Encounter"},
            observations: {type: 'list', objectType: 'Observation'},
            relationships: {type: 'list', objectType: 'IndividualRelationship'}
        }
    };

    static validationKeys = {
        DOB: 'DOB',
        GENDER: 'GENDER',
        FIRST_NAME: 'FIRST_NAME',
        LAST_NAME: 'LAST_NAME',
        REGISTRATION_DATE: 'REGISTRATION_DATE',
        LOWEST_ADDRESS_LEVEL: 'LOWEST_ADDRESS_LEVEL'
    };

    static createEmptyInstance() {
        const individual = new Individual();
        individual.uuid = General.randomUUID();
        individual.registrationDate = new Date();
        individual.gender = Gender.create("");
        individual.observations = [];
        individual.encounters = [];
        individual.enrolments = [];
        individual.relationships = [];
        individual.lowestAddressLevel = AddressLevel.create({uuid: "", title: "", level: 0, typeString: ""});
        individual.voided = false;
        return individual;
    }

    get toResource() {
        const resource = _.pick(this, ["uuid", "firstName", "lastName", "dateOfBirthVerified", "voided"]);
        resource.dateOfBirth = moment(this.dateOfBirth).format('YYYY-MM-DD');
        resource.registrationDate = moment(this.registrationDate).format('YYYY-MM-DD');
        resource["genderUUID"] = this.gender.uuid;
        resource["addressLevelUUID"] = this.lowestAddressLevel.uuid;

        resource["observations"] = [];
        this.observations.forEach((obs) => {
            resource["observations"].push(obs.toResource);
        });

        return resource;
    }

    findObservationAcrossAllEnrolments(conceptName) {
        return this.enrolments.find(enrolment => enrolment.findLatestObservationInEntireEnrolment(conceptName) !== undefined);
    }

    observationExistsAcrossAllEnrolments(conceptName) {
        return this.enrolments.find(enrolment => enrolment.findLatestObservationInEntireEnrolment(conceptName) !== undefined);
    }

    static newInstance(uuid, firstName, lastName, dateOfBirth, dateOfBirthVerified, gender, lowestAddressLevel) {
        const individual = new Individual();
        individual.uuid = uuid;
        individual.firstName = firstName;
        individual.lastName = lastName;
        individual.name = individual.nameString;
        individual.dateOfBirth = dateOfBirth;
        individual.dateOfBirthVerified = dateOfBirthVerified;
        individual.gender = gender;
        individual.lowestAddressLevel = lowestAddressLevel;
        return individual;
    }

    static fromResource(individualResource, entityService) {
        const addressLevel = entityService.findByKey("uuid", ResourceUtil.getUUIDFor(individualResource, "addressUUID"), AddressLevel.schema.name);
        const gender = entityService.findByKey("uuid", ResourceUtil.getUUIDFor(individualResource, "genderUUID"), Gender.schema.name);
        const individual = General.assignFields(individualResource,
            new Individual(),
            ["uuid", "firstName", "lastName", "dateOfBirthVerified", "voided"],
            ["dateOfBirth", 'registrationDate'],
            ["observations"],
            entityService);
        individual.gender = gender;
        individual.lowestAddressLevel = addressLevel;
        individual.name = `${individual.firstName} ${individual.lastName}`;
        return individual;
    }

    isMale() {
        return this.gender.isMale();
    }

    isFemale() {
        return this.gender.isFemale();
    }

    static merge = (childEntityClass) =>
        BaseEntity.mergeOn(new Map([
            [ProgramEnrolment, 'enrolments'],
            [Encounter, "encounters"],
            [IndividualRelationship, 'relationships']
        ]).get(childEntityClass));

    static associateRelationship(child, childEntityClass, childResource, entityService) {
        var individual = entityService.findByKey("uuid", ResourceUtil.getUUIDFor(childResource, "individualAUUID"), Individual.schema.name);
        individual = General.pick(individual, ["uuid"], ["enrolments", "encounters", "relationships"]);
        BaseEntity.addNewChild(child, individual.relationships);
        return individual;
    }

    static associateChild(child, childEntityClass, childResource, entityService) {
        if (childEntityClass === IndividualRelationship) {
            return Individual.associateRelationship(child, childEntityClass, childResource, entityService);
        }
        var individual = entityService.findByKey("uuid", ResourceUtil.getUUIDFor(childResource, "individualUUID"), Individual.schema.name);
        individual = General.pick(individual, ["uuid"], ["enrolments", "encounters", "relationships"]);

        if (childEntityClass === ProgramEnrolment)
            BaseEntity.addNewChild(child, individual.enrolments);
        else if (childEntityClass === Encounter)
            BaseEntity.addNewChild(child, individual.encounters);
        else
            throw `${childEntityClass.name} not support by ${Individual.nameString}`;

        return individual;
    }

    setFirstName(firstName) {
        this.firstName = firstName;
        this.name = this.nameString;
    }

    setLastName(lastName) {
        this.lastName = lastName;
        this.name = this.nameString;
    }

    getDisplayAge(i18n) {
        //Keeping date of birth to be always entered and displayed as per the current date. It would be perhaps more error prone for users to put themselves in the past and enter age as of that date
        const ageInYears = this.getAgeInYears();
        if (ageInYears < 1) {
            let ageInWeeks = moment().diff(this.dateOfBirth, 'weeks');
            return ageInWeeks === 0 ? Duration.inDay(moment().diff(this.dateOfBirth, 'days')).toString(i18n) : Duration.inWeek(ageInWeeks).toString(i18n);
        } else if (ageInYears < 2) {
            return Duration.inMonth(moment().diff(this.dateOfBirth, 'months')).toString(i18n);
        } else {
            return Duration.inYear(ageInYears).toString(i18n);
        }
    }

    getAgeAndDateOfBirthDisplay(i18n) {
        if (this.dateOfBirthVerified)
            return `${this.getDisplayAge(i18n)} (${General.toDisplayDate(this.dateOfBirth)})`;
        return this.getDisplayAge(i18n);
    }

    getAge(asOnDate) {
        asOnDate = asOnDate || moment();
        if (this.getAgeInYears(asOnDate) > 0) return Duration.inYear(this.getAgeInYears());
        if (this.getAgeInMonths(asOnDate) > 0) return Duration.inMonth(asOnDate.diff(this.dateOfBirth, 'months'));
        return Duration.inYear(0);
    }

    get nameString() {
        return `${this.firstName} ${this.lastName}`;
    }

    getAgeIn(unit) {
        return (asOnDate = moment(), precise = false) => moment(asOnDate).diff(this.dateOfBirth, unit, precise);
    }

    getAgeInMonths(asOnDate, precise) {
        return this.getAgeIn("months")(asOnDate, precise);
    }

    getAgeInWeeks(asOnDate, precise) {
        return this.getAgeIn("weeks")(asOnDate, precise);
    }

    getAgeInYears(asOnDate, precise) {
        return this.getAgeIn("years")(asOnDate, precise);
    }

    toSummaryString() {
        return `${this.name}, Age: ${this.getAge().toString()}, ${this.gender.name}`;
    }

    setDateOfBirth(date) {
        this.dateOfBirth = date;
        this.dateOfBirthVerified = true;
    }

    setAge(age, isInYears) {
        this.dateOfBirth = moment().subtract(age, isInYears ? 'years' : 'months').toDate();
        this.dateOfBirthVerified = false;
    }

    validateDateOfBirth() {
        if (_.isNil(this.dateOfBirth)) {
            return ValidationResult.failure(Individual.validationKeys.DOB, "emptyValidationMessage");
        } else if (this.getAgeInYears() > 120) {
            return ValidationResult.failure(Individual.validationKeys.DOB, "ageTooHigh");
        } else if (this.isRegistrationBeforeDateOfBirth) {
            return ValidationResult.failure(Individual.validationKeys.DOB, 'registrationBeforeDateOfBirth');
        } else if (General.dateIsAfterToday(this.dateOfBirth)) {
            return ValidationResult.failure(Individual.validationKeys.DOB, "birthDateInFuture");
        } else {
            return ValidationResult.successful(Individual.validationKeys.DOB);
        }
    }

    get isRegistrationBeforeDateOfBirth() {
        if (_.isNil(this.dateOfBirth) || _.isNil(this.registrationDate)) return false;
        return General.dateAIsAfterB(this.dateOfBirth, this.registrationDate);
    }

    validateRegistrationDate() {
        const validationResult = this.validateFieldForEmpty(this.registrationDate, Individual.validationKeys.REGISTRATION_DATE);
        if (validationResult.success && this.isRegistrationBeforeDateOfBirth) {
            return ValidationResult.failure(Individual.validationKeys.REGISTRATION_DATE, 'registrationBeforeDateOfBirth');
        }
        if(validationResult.success && General.dateIsAfterToday(this.registrationDate)) {
            return ValidationResult.failure(Individual.validationKeys.REGISTRATION_DATE, 'registrationDateInFuture');
        }
        return validationResult;
    }

    validateFirstName() {
        return this.validateFieldForEmpty(this.firstName, Individual.validationKeys.FIRST_NAME);
    }

    validateLastName() {
        return this.validateFieldForEmpty(this.lastName, Individual.validationKeys.LAST_NAME);
    }

    validate() {
        const validationResults = [];
        validationResults.push(this.validateFirstName());
        validationResults.push(this.validateLastName());
        validationResults.push(this.validateDateOfBirth());
        validationResults.push(this.validateRegistrationDate());
        validationResults.push(this.validateGender());
        validationResults.push(this.validateAddress());
        return validationResults;
    }

    validateAddress() {
        return this.validateFieldForEmpty(_.isEmpty(this.lowestAddressLevel) ? undefined : this.lowestAddressLevel.name,
            Individual.validationKeys.LOWEST_ADDRESS_LEVEL);
    }

    validateGender() {
        return this.validateFieldForEmpty(_.isEmpty(this.gender) ? undefined : this.gender.name,
            Individual.validationKeys.GENDER);
    }

    isGender(gender) {
        return this.gender === gender;
    }

    eligiblePrograms(allPrograms) {
        const eligiblePrograms = _.slice(allPrograms);

        _.remove(eligiblePrograms, (program) => {
            const find = _.find(this.enrolments, (enrolment) => {
                return enrolment.program.uuid === program.uuid && enrolment.isActive;
            });
            return find !== undefined;
        });

        return eligiblePrograms;
    }

    addEncounter(encounter) {
        if (!_.some(this.encounters, (existingEncounter) => existingEncounter.uuid === encounter.uuid))
            this.encounters.push(encounter);
    }


    cloneForEdit() {
        const individual = new Individual();
        individual.uuid = this.uuid;
        individual.name = this.name;
        individual.firstName = this.firstName;
        individual.lastName = this.lastName;
        individual.dateOfBirth = this.dateOfBirth;
        individual.registrationDate = this.registrationDate;
        individual.dateOfBirthVerified = this.dateOfBirthVerified;
        individual.voided = this.voided;
        individual.gender = _.isNil(this.gender) ? null : this.gender.clone();
        individual.lowestAddressLevel = _.isNil(this.lowestAddressLevel) ? null : {...this.lowestAddressLevel};
        individual.observations = ObservationsHolder.clone(this.observations);
        return individual;
    }

    cloneForReference() {
        const individual = new Individual();
        individual.uuid = this.uuid;
        individual.name = this.name;
        individual.firstName = this.firstName;
        individual.lastName = this.lastName;
        individual.dateOfBirth = this.dateOfBirth;
        individual.gender = _.isNil(this.gender) ? null : this.gender.clone();
        return individual;
    }

    get hasActiveEnrolment() {
        return _.some(this.enrolments, (enrolment) => enrolment.isActive);
    }

    get firstActiveOrRecentEnrolment() {
        return _.find(_.reverse(_.sortBy(this.enrolments, (enrolment) => enrolment.enrolmentDateTime), (enrolment) => enrolment.isActive));
    }

    get hasEnrolments() {
        return this.enrolments.length;
    }

    findEnrolment(enrolmentUUID) {
        return _.find(this.enrolments, (enrolment) => enrolment.uuid === enrolmentUUID);
    }

    addEnrolment(programEnrolment) {
        if (!_.some(this.enrolments, (x) => x.uuid === programEnrolment.uuid)) {
            this.enrolments.push(programEnrolment);
        }
    }

    addRelationship(relationship) {
        if (!_.some(this.relationships, (x) => x.uuid === relationship.uuid)) {
            this.relationships = _.isEmpty(this.relationships) ? [] : this.relationships;
            this.relationships.push(relationship);
        }
    }

    findObservation(conceptName) {
        return _.find(this.observations, (observation) => {
            return observation.concept.name === conceptName
        });
    }

    getObservationValue(conceptName) {
        const observationForConcept = this.findObservation(conceptName);
        return _.isEmpty(observationForConcept) ? observationForConcept : observationForConcept.getValue();
    }

    getRelationships() {
        return _.filter(this.relationships, (v) => !v.voided);
    }

    getRelative(relationName, inverse = false) {
        return _.head(this.getRelatives(relationName, inverse));
    }

    getRelatives(relationName, inverse = false) {
        return _.filter(this.getRelationships(), (relation) => {
            return inverse ? relation.relationship.individualAIsToBRelation.name === relationName : relation.relationship.individualBIsToARelation.name === relationName;
        }).map((relation) => relation.individualB);
    }

    getPreviousEnrolment(programName, enrolmentUUID) {
        const chronologicalEnrolments = this.chronologicalEnrolments;
        let index = _.findIndex(chronologicalEnrolments, (enrolment) => enrolment.uuid === enrolmentUUID);
        while (index > 0) {
            if (chronologicalEnrolments[--index].program.name === programName) return chronologicalEnrolments[index];
        }
        return null;
    }

    get chronologicalEnrolments() {
        return _.sortBy(this.enrolments, (enrolment) => enrolment.encounterDateTime);
    }

    toJSON() {
        return {
            uuid: this.uuid,
            firstName: this.firstName,
            lastName: this.lastName,
            enrolments: this.enrolments,
            dateOfBirth: this.dateOfBirth,
            gender: this.gender,
            registrationDate: this.registrationDate,
            lowestAddressLevel: this.lowestAddressLevel,
            encounters: this.encounters,
            observations: this.observations,
            relationships: this.relationships,
            voided: this.voided
        };
    }
}

export default Individual;
