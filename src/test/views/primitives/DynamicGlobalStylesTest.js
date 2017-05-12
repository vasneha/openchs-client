import {Dimensions} from "react-native";
import {expect} from "chai";
import DynamicGlobalStyles from "../../../js/views/primitives/DynamicGlobalStyles";

describe('DynamicGlobalStylesTest', () => {
    it('numberOfRows', () => {
        console.log(Dimensions.get('window').width);
        console.log(DynamicGlobalStyles.numberOfRows(10));
    });
});