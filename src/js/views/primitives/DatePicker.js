import {DatePickerAndroid, View} from "react-native";
import React from "react";
import AbstractComponent from "../../framework/view/AbstractComponent";
import _ from "lodash";
import ValidationErrorMessage from "../form/ValidationErrorMessage";
import DynamicGlobalStyles from "./DynamicGlobalStyles";
import Colors from "./Colors";
import General from "../../utility/General";
import {Text} from "native-base";

class DatePicker extends AbstractComponent {
    static propTypes = {
        dateValue : React.PropTypes.object,
        validationResult: React.PropTypes.object,
        actionName: React.PropTypes.string.isRequired,
        actionObject: React.PropTypes.object.isRequired,
        noDateMessageKey: React.PropTypes.string
    };

    constructor(props, context) {
        super(props, context);
    }

    render() {
        return (
            <View>
                <Text onPress={this.showPicker.bind(this, 'simple', {date: new Date()})}
                      style={[DynamicGlobalStyles.formElementLabel, {color: _.isNil(this.props.validationResult) ? Colors.ActionButtonColor : Colors.ValidationError}]}>{this.dateDisplay(this.props.dateValue, this.props.noDateMessageKey)}</Text>
                <ValidationErrorMessage validationResult={this.props.validationResult}/>
            </View>
        );
    }

    dateDisplay(date, defaultMessageKey) {
        return _.isNil(date) ? this.I18n.t(defaultMessageKey ? defaultMessageKey : "chooseADate") : General.formatDate(date);
    }

    async showPicker(stateKey, options) {
        const {action, year, month, day} = await DatePickerAndroid.open(options);
        if (action !== DatePickerAndroid.dismissedAction) {
            this.props.actionObject.value = new Date(year, month, day);
            this.dispatchAction(this.props.actionName, this.props.actionObject);
        }
    }
}

export default DatePicker;