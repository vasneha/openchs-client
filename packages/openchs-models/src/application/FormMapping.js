import ResourceUtil from "../utility/ResourceUtil";
import Form from "./Form";
import General from "../utility/General";

class FormMapping {
    static schema = {
        name: 'FormMapping',
        primaryKey: 'uuid',
        properties: {
            uuid: 'string',
            form: 'Form',
            entityUUID: {type: 'string', optional: true},
            observationsTypeEntityUUID: {type:'string', optional: true},
            voided: { type: 'bool', default: false }
        }
    };

    static create(uuid, form, entityUUID, observationsTypeEntityUUID) {
        let formMapping = new FormMapping();
        formMapping.uuid = uuid;
        formMapping.form = form;
        formMapping.entityUUID = entityUUID;
        formMapping.observationsTypeEntityUUID = observationsTypeEntityUUID;
        return formMapping;
    }

    static fromResource(resource, entityService) {
        const form = entityService.findByKey("uuid", ResourceUtil.getUUIDFor(resource, "formUUID"), Form.schema.name);

        const formMapping = General.assignFields(resource, new FormMapping(), ["uuid", "voided"]);
        formMapping.entityUUID = ResourceUtil.getUUIDFor(resource, "entityUUID");
        formMapping.observationsTypeEntityUUID = ResourceUtil.getUUIDFor(resource, "observationsTypeEntityUUID");
        formMapping.form = form;

        return formMapping;
    }
}

export default FormMapping;