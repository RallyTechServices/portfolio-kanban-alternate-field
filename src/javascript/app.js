Ext.define("TSPortfolioKanbanAlternateField", {
    extend: 'Rally.apps.common.PortfolioItemsGridBoardApp',
    requires: [
        'Rally.apps.common.RowSettingsField',
        'Rally.apps.portfoliokanban.PortfolioKanbanCard',
        'Rally.apps.portfoliokanban.PortfolioKanbanPolicy',
        'Rally.ui.gridboard.plugin.BoardPolicyDisplayable',
        'Rally.ui.cardboard.plugin.ColumnPolicy',
        'Rally.ui.cardboard.Column',
        'Rally.ui.cardboard.Card',
        'Rally.util.Help',
        'Rally.util.Test',
        'Deft.Deferred'
    ],

    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    
    appName: 'Portfolio Kanban',
    autoScroll: false,
    cls: 'portfolio-kanban',
    statePrefix: 'portfolio-kanban',
    toggleState: 'board',
    settingsScope: 'project',

    config: {
        defaultSettings: {
            groupByField: 'State',
            fields: 'Discussion,PercentDoneByStoryCount,UserStories,Milestones'
        }
    },

    mixins: [
      "Rally.clientmetrics.ClientMetricsRecordable"
    ],

    clientMetrics: [
        {
            method: '_showHelp',
            description: 'portfolio-kanban-show-help'
        }
    ],

    constructor: function(config) {        
        config.settingsScope = config.isFullPageApp ? 'project' : 'app';
        this.callParent([config]);
    },

    getSettingsFields: function () {
        var fields = [];

        fields.push({
            name: 'groupByField',
            xtype: 'rallyfieldcombobox',
            model: Ext.identityFn('PortfolioItem'),
            margin: '10px 0 0 0',
            fieldLabel: 'Columns',
            listeners: {
                select: function(combo) {
                    this.fireEvent('fieldselected', combo.getRecord().get('fieldDefinition'));
                },
                ready: function(combo) {
                    combo.store.filterBy(function(record) {
                        var attr = record.get('fieldDefinition').attributeDefinition;
                        if ( attr.ElementName == "State" ) { return true; }
                        return attr && !attr.ReadOnly && attr.Constrained && attr.AttributeType !== 'OBJECT' && attr.AttributeType !== 'COLLECTION';
                    });
                    if (combo.getRecord()) {
                        this.fireEvent('fieldselected', combo.getRecord().get('fieldDefinition'));
                    }
                }
            },
            bubbleEvents: ['fieldselected', 'fieldready']
        });
            
        //if (this.getContext().isFeatureEnabled('S79575_ADD_SWIMLANES_TO_PI_KANBAN')) {
            fields.push({
                name: 'groupHorizontallyByField',
                xtype: 'rowsettingsfield',
                fieldLabel: 'Swimlanes',
                margin: '10 0 10 0',
                mapsToMultiplePreferenceKeys: ['showRows', 'rowsField'],
                readyEvent: 'ready',
                modelNames: ['PortfolioItem'],
                isAllowedFieldFn: function (field) {
                    var attr = field.attributeDefinition;
                    return (attr.Custom && (attr.Constrained || attr.AttributeType.toLowerCase() !== 'string')
                        || attr.Constrained || _.contains(['boolean'], attr.AttributeType.toLowerCase())) &&
                        !_.contains(['web_link', 'text', 'date'], attr.AttributeType.toLowerCase()) &&
                        !_.contains(['Archived', 'Portfolio Item Type', 'State'], attr.Name);
                }
            });
        //}

        fields.push({
            type: 'query',
            config: {
                plugins: [
                    {
                        ptype: 'rallyhelpfield',
                        helpId: 271
                    },
                    'rallyfieldvalidationui'
                ]
            }
        });


        return fields;
    },

    _createFilterItem: function(typeName, config) {
        return Ext.apply({
            xtype: typeName,
            margin: '-15 0 5 0',
            showPills: true,
            showClear: true
        }, config);
    },

    getHeaderControls: function () {
        var ctls = this.callParent(arguments);
        ctls.unshift(this._buildHelpComponent());
        ctls.push(this._buildFilterInfo());
        return ctls;
    },

    getGridBoardPlugins: function () {
        return this.callParent(arguments).concat([{
            ptype: 'rallyboardpolicydisplayable',
            pluginId: 'boardPolicyDisplayable',
            prefKey: 'piKanbanPolicyChecked',
            checkboxConfig: {
                boxLabel: 'Show Policies',
                margin: '2 5 5 5'
            }
        }]);
    },

    getFilterControlConfig: function () {
        var config = this.callParent(arguments);
        return _.merge(config, {
            blackListFields: _.union(config.blackListFields, ['State'])
        });
    },

    getCardConfig: function () {
        return {
            xtype: 'rallyportfoliokanbancard'
        };
    },

    getCardBoardConfig: function () {
        var config = _.merge(this.callParent(arguments), {
            loadDescription: 'Portfolio Kanban'
        });

//        if (this.getSetting('showRows') && this.getSetting('rowsField') &&
//            this.getContext().isFeatureEnabled('S79575_ADD_SWIMLANES_TO_PI_KANBAN')) {
        if (this.getSetting('showRows') && this.getSetting('rowsField')) {
            Ext.apply(config, {
                rowConfig: {
                    field: this.getSetting('rowsField'),
                    sortDirection: 'ASC'
                }
            });
        }

        return config;
    },

    getCardBoardColumnPlugins: function (state) {
        var policyPlugin = this.gridboard && this.gridboard.getPlugin('boardPolicyDisplayable');
        return {
            ptype: 'rallycolumnpolicy',
            policyCmpConfig: {
                xtype: 'rallyportfoliokanbanpolicy',
                hidden: !policyPlugin || !policyPlugin.isChecked(),
                title: 'Exit Policy',
                stateRecord: state
            }
        };
    },

    publishComponentReady: function () {
        this.fireEvent('contentupdated');
        this.callParent(arguments);
        Rally.environment.getMessageBus().publish(Rally.Message.piKanbanBoardReady);
    },

    _buildHelpComponent: function (config) {
        return this.isFullPageApp ? null : Ext.create('Ext.Component', Ext.apply({
            cls: 'help-field ' + Rally.util.Test.toBrowserTestCssClass('portfolio-kanban-help-container'),
            renderTpl: Rally.util.Help.getIcon({
                id: 265
            })
        }, config));
    },

    _buildFilterInfo: function () {
        this.filterInfo = this.isFullPageApp ? null : Ext.create('Rally.ui.tooltip.FilterInfo', {
            projectName: this.getSetting('project') && this.getContext().get('project').Name || 'Following Global Project Setting',
            scopeUp: this.getSetting('projectScopeUp'),
            scopeDown: this.getSetting('projectScopeDown'),
            query: this.getSetting('query')
        });

        return this.filterInfo;
    },
    
    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    },
    
    //onSettingsUpdate:  Override
    onSettingsUpdate: function (settings){
        this.logger.log('onSettingsUpdate',settings);
        Ext.apply(this, settings);

//        
//        this.getCardBoardColumns().then({
//            success: function (columns) {
//                this.addGridBoard({
//                    columns: []
//                });
//    
//                if (!columns || columns.length === 0) {
//                    this.showNoColumns();
//                    this.publishComponentReady();
//                }
//            },
//            scope: this
//        });
                            
        this.addGridBoard();
    }
});
