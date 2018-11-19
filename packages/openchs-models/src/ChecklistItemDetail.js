import _ from "lodash";
import ResourceUtil from "./utility/ResourceUtil";
import General from "./utility/General";
import BaseEntity from "./BaseEntity";
import Form from "./application/Form";
import ChecklistDetail from "./ChecklistDetail";
import Concept from "./Concept";
import ChecklistItemStatus from "./ChecklistItemStatus";

class ChecklistItemDetail extends BaseEntity {
    static schema = {
        name: 'ChecklistItemDetail',
        primaryKey: 'uuid',
        properties: {
            uuid: 'string',
            concept: 'Concept',
            stateConfig: {type: 'list', objectType: 'ChecklistItemStatus'},
            form: {type: 'Form', optional: true},
            checklistDetail: 'ChecklistDetail',
            voided: {type: 'bool', default: false},
            dependentOn: {type: 'ChecklistItemDetail', optional: true}
        }
    };

    static fromResource(checklistItemResource, entityService, createdEntities) {
        const checklistDetail = entityService.findByKey("uuid", ResourceUtil.getUUIDFor(checklistItemResource, "checklistDetailUUID"), ChecklistDetail.schema.name);
        const form = entityService.findByKey("uuid", ResourceUtil.getUUIDFor(checklistItemResource, "formUUID"), Form.schema.name);
        const concept = entityService.findByKey("uuid", ResourceUtil.getUUIDFor(checklistItemResource, "conceptUUID"), Concept.schema.name);
        const checklistItemDetail = General.assignFields(checklistItemResource, new ChecklistItemDetail(), ["uuid", "voided"]);
        checklistItemDetail.stateConfig = _.get(checklistItemResource, "checklistItemStatus", [])
            .map(itemStatus => ChecklistItemStatus.fromResource(itemStatus, entityService));
        checklistItemDetail.checklistDetail = checklistDetail;
        checklistItemDetail.form = form;
        checklistItemDetail.concept = concept;
        const leadDetailUUID = ResourceUtil.getUUIDFor(checklistItemResource, "leadDetailUUID");
        const createdLeadChecklistItemDetail = entityService.findByKey("uuid", leadDetailUUID, ChecklistItemDetail.schema.name);
        if (_.isNil(createdLeadChecklistItemDetail)) {
            checklistItemDetail.dependentOn = createdEntities.find(entity => entity.uuid === leadDetailUUID);
        } else {
            checklistItemDetail.dependentOn = createdLeadChecklistItemDetail;
        }
        return checklistItemDetail;
    }
}

export default ChecklistItemDetail;