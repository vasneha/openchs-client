import {StyleSheet, Text, Image, View, TouchableNativeFeedback, Navigator} from 'react-native';
import React, {Component} from 'react';
import TypedTransition from "../../framework/routing/TypedTransition";
import Colors from '../primitives/Colors';
import MessageService from '../../service/MessageService';
import SettingsView from "../settings/SettingsView";
import UIConfiguration from "../viewmodel/UIConfiguration";
import SyncService from "../../service/SyncService";
import EntityMetaData from "../../models/EntityMetaData";
import {Tabs, Header, Title, Button, Icon} from 'native-base';

class OldAppHeader extends Component {
    constructor(props, context) {
        super(props, context);
        this.I18n = context.getService(MessageService).getI18n();
        this.sync = this.sync.bind(this);
    }

    static contextTypes = {
        getService: React.PropTypes.func.isRequired
    };

    static propTypes = {
        title: React.PropTypes.string.isRequired,
        onTitlePressed: React.PropTypes.func,
        parent: React.PropTypes.object.isRequired
    };

    static styles = StyleSheet.create({
        main: {
            backgroundColor: Colors.Primary,
            flexDirection: 'row',
            justifyContent: 'space-between'
        },
        icon: {
            flex: 1,
            padding: 3,
            paddingTop: 5,
            alignSelf: "flex-end"
        },
        header: {
            color: '#FFFFFF',
            textAlignVertical: 'center',
            textAlign: 'center',
            fontSize: 26,
            flex: 1
        }
    });

    onBackPress = () => {
        TypedTransition.from(this.props.parent).goBack();
    };

    onSettingsPress = () => {
        TypedTransition.from(this.props.parent).to(SettingsView, Navigator.SceneConfigs.FloatFromLeft);
    };

    renderImage() {
        var iconName = UIConfiguration.getIconName(this.props.parent.viewName());
        if (iconName === "Settings")
            return (<Image source={require('../../../../android/app/src/main/res/mipmap-mdpi/settings_50.png')}/>);
        else
            return (<Image source={require('../../../../android/app/src/main/res/mipmap-mdpi/back_50.png')}/>);
    }

    sync() {
        var syncService = this.context.getService(SyncService);
        syncService.sync(EntityMetaData.model());
    };

    render() {
        const topLeftActionMap = {
            "Settings": this.onSettingsPress,
            "Back": this.onBackPress
        };

        // const onPress = topLeftActionMap[UIConfiguration.TopLeftActionMap[this.props.parent.viewName()]];

        return (
            <View style={{flex: 1, flexDirection: 'row'}}>
                <Tabs style={{flex: 0.8}}>
                    <SettingsView tabLabel='Menu'/>
                    <SettingsView tabLabel='Home'/>
                </Tabs>
                <Button style={{flex: 0.2}}> Click Me! </Button>
            </View>
        );
    }
}

export default OldAppHeader;