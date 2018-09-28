import Filter from "./Filter";

export default class SingleSelectFilter extends Filter {
    constructor(label, optsFnMap, options) {
        super(label, Filter.types.SingleSelect, optsFnMap, options);
    }

    selectOption(option) {
        return new Filter(this.label, this.type, this.optsFnMap, this.selectedOptions.indexOf(option) > -1 ? [] : [option]);
    }
}