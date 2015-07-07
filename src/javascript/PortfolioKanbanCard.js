/**
 * A special cardboard card for use by the PortfolioKanbanApp
 */
Ext.define('Rally.apps.portfoliokanban.PortfolioKanbanCard', {
    extend:'Rally.ui.cardboard.Card',
    alias:'widget.rallyportfoliokanbancard',

    inheritableStatics:{

        getFetchFields:function () {
            return [
                'Owner',
                'FormattedID',
                'Name',
                'StateChangedDate',
                'Blocked',
                'Ready',
                'DisplayColor'
            ];
        }

    },

    config: {
        customFieldConfig: {
            UserStories: {
                fetch: ['UserStories', 'LeafStoryPlanEstimateTotal', 'LeafStoryCount'],
                popoverConfig: {
                    placement: ['bottom', 'right', 'left', 'top'],
                    listViewConfig: {
                        addNewConfig: {
                            showAddWithDetails: false
                        },
                        gridConfig: {
                            columnCfgs: [
                                {
                                    dataIndex: 'FormattedID',
                                    width: 90
                                },
                                {
                                    dataIndex: 'Name',
                                    flex: 1
                                },
                                {
                                    dataIndex: 'Release',
                                    width: 90
                                },
                                {
                                    dataIndex: 'Iteration',
                                    width: 90
                                },
                                {
                                    dataIndex: 'ScheduleState', // 'dataIndex' is the actual field name
                                    text: 'State', // 'text' is the display name
                                    width: 90
                                },
                                {
                                    dataIndex: 'PlanEstimate',
                                    editor: {
                                        decimalPrecision: 0
                                    },
                                    width: 90
                                },
                                {
                                    dataIndex: 'Project',
                                    width: 60
                                }
                            ]
                        }
                    }
                }
            }
        }
    },

    constructor: function(config) {
        config.fields = Ext.Array.union(config.fields || [], ['StateChangedDate']);
        this.callParent(arguments);
    }
});