import {ListView, Text, View} from "react-native";
import React from "react";
import AbstractComponent from "../../framework/view/AbstractComponent";
import Fonts from "../primitives/Fonts";
import Colors from "../primitives/Colors";
import Styles from "../primitives/Styles";
import Separator from "../primitives/Separator";

class Relatives extends AbstractComponent {
    static propTypes = {
        relatives: React.PropTypes.object.isRequired,
        style: React.PropTypes.object,
        title: React.PropTypes.string,
        highlight: React.PropTypes.bool,
    };

    constructor(props, context) {
        super(props, context);
        this.createObservationsStyles(props.highlight);
    }

    createObservationsStyles(highlight) {
        this.styles = highlight ?
            {
                observationTable: {
                    marginHorizontal: 3,
                    backgroundColor: Colors.HighlightBackgroundColor
                },
                observationRow: {borderRightWidth: 1, borderColor: 'rgba(0, 0, 0, 0.12)'},
                observationColumn: {
                    borderLeftWidth: 1,
                    borderColor: 'rgba(0, 0, 0, 0.12)',
                    paddingLeft: 3,
                    paddingBottom: 2,
                    flex: 1
                }
            }
            :
            {
                observationTable: {
                    marginHorizontal: 3,
                    backgroundColor: Colors.GreyContentBackground
                },
                observationRow: {borderRightWidth: 1, borderColor: 'rgba(0, 0, 0, 0.12)'},
                observationColumn: {
                    borderLeftWidth: 1,
                    borderColor: 'rgba(0, 0, 0, 0.12)',
                    paddingLeft: 3,
                    paddingBottom: 2,
                    flex: 1
                }
            }
    }

    renderTitle() {
        if (this.props.title) return (<Text style={Fonts.Title}>{this.props.title}</Text>);
    }

    render() {
        if (this.props.relatives.length === 0) return <View/>;

         const relatives = this.props.relatives
             .map(relative => [this.I18n.t(relative.relation.name), relative.relative.nameString, relative.relative.individualUUID]);
        const dataSource = new ListView.DataSource({rowHasChanged: () => false}).cloneWithRows(relatives);
        return (
            <View style={{flexDirection: "column", paddingBottom: 10}}>
                {this.renderTitle()}
                <ListView
                    enableEmptySections={true}
                    dataSource={dataSource}
                    style={this.styles.observationTable}
                    pageSize={20}
                    initialListSize={10}
                    removeClippedSubviews={true}
                    renderSeparator={(ig, idx) => (<Separator key={idx} height={1}/>)}
                    renderHeader={() => (<Separator height={1} backgroundColor={'rgba(0, 0, 0, 0.12)'}/>)}
                    renderRow={([relationName, individualName, individualUUID]) =>
                        < View style={[{flexDirection: "row"}, this.styles.observationRow]}>
                            <Text style={[{
                                textAlign: 'left',
                                fontSize: Fonts.Normal,
                                color: Styles.greyText
                            }, this.styles.observationColumn]}>{relationName}</Text>
                            <Text style={[{
                                textAlign: 'left',
                                fontSize: Fonts.Medium,
                                color: Styles.blackColor
                            }, this.styles.observationColumn]}>{individualName}</Text>
                        </View>}
                />
            </View>
        );
    }
}

export default Relatives;