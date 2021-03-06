import {assert} from "chai";
import _ from "lodash";
import IndividualService from "../../../src/service/IndividualService";
import TestContext from '../views/testframework/TestContext'

import Realm from 'realm';
import {Schema, Individual, Gender} from "openchs-models";
import EntityFactory from "openchs-models/test/EntityFactory";
import IndividualSearchCriteria from "../../../src/service/query/IndividualSearchCriteria";
import General from "openchs-models/src/utility/General";

describe('IndividualServiceTest', () => {
    let individualService;

    beforeEach(() => {
        const realmConfig = Schema;
        realmConfig.inMemory = true;
        individualService = new IndividualService(new Realm(realmConfig), new TestContext());
    });

    afterEach(() => {
        individualService.db.close();
    });

    const callTestFunction = (individuals) => {
        return [...individuals.reduce(individualService._uniqIndividualsFrom, new Map()).values()];
    };

    const createIndividual = (voided) => {
        const individual = Individual.newInstance(General.randomUUID(), "test", "user", new Date(), true, Gender.create("Male"), null);
        individual.registrationDate = new Date();
        individual.observations = [];
        individual.voided = voided;
        return individual;
    }

    describe("Test void individual", () => {
        it("should include voided individuals in search results when includeVoided is true", () => {
            const individualSearchCriteria = IndividualSearchCriteria.empty();
            individualSearchCriteria.addNameCriteria("test");
            individualSearchCriteria.addVoidedCriteria(true);
    
            const indi1 = createIndividual(false);
            const indi2 = createIndividual(true);

            individualService.register(indi1);
            individualService.register(indi2);
            
            const results = individualService.search(individualSearchCriteria);
            assert.lengthOf(results, 2);
        });

        it("should not include voided individuals in search results when includeVoided is false", () => {
            //includeVoided is going to be false by default in an empty search criteria,
            //so we do not need to set it
            const individualSearchCriteria = IndividualSearchCriteria.empty();
            individualSearchCriteria.addNameCriteria("test");
    
            const indi1 = createIndividual(false);
            const indi2 = createIndividual(true);

            individualService.register(indi1);
            individualService.register(indi2);
            
            const results = individualService.search(individualSearchCriteria);
            assert.lengthOf(results, 1);
        });
    });

    describe("Unique Individuals from Encounter", () => {
        it("Should return empty collection if no encounters", () => {
            const individuals = callTestFunction([]);
            assert.equal(0, individuals.length);
        });

        it("Should return individuals if there is 1 encounter per individual", () => {
            const individual1 = EntityFactory.createIndividual("Person 1");
            const individual2 = EntityFactory.createIndividual("Person 2");
            const individual3 = EntityFactory.createIndividual("Person 3");
            const individuals = callTestFunction([individual1, individual2, individual3]);
            assert.equal(3, individuals.length);
            assert.equal(individual1.uuid, individuals[0].uuid);
            assert.equal(individual2.uuid, individuals[1].uuid);
            assert.equal(individual3.uuid, individuals[2].uuid);
        });

        it("Should return unique individuals if there are multiple encounter per individual", () => {
            const individual1 = EntityFactory.createIndividual("Person 1");
            const individual2 = EntityFactory.createIndividual("Person 2");
            const individual3 = EntityFactory.createIndividual("Person 3");
            const individuals = callTestFunction([individual1, individual2, individual3, individual1, individual2, individual3, individual2, individual2, individual2, individual2, individual2, individual2, individual3]);
            assert.equal(3, individuals.length);
            assert.equal(individual1.uuid, individuals[0].uuid);
            assert.equal(individual2.uuid, individuals[1].uuid);
            assert.equal(individual3.uuid, individuals[2].uuid);
        });
    });

});