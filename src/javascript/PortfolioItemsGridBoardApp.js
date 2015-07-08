Ext.define('Rally.apps.common.PortfolioItemsGridBoardApp', {
    extend: 'Rally.app.GridBoardApp',
    requires: [
        'Rally.ui.cardboard.plugin.CollapsibleColumns',
        'Rally.ui.cardboard.plugin.FixedHeader'
    ],

    launch: function () {
        if (Rally.environment.getContext().getSubscription().isModuleEnabled('Rally Portfolio Manager')) {
            this.callParent(arguments);
        } else {
            this.add({
                xtype: 'container',
                html: '<div class="rpm-turned-off" style="padding: 50px; text-align: center;">You do not have RPM enabled for your subscription</div>'
            });

            this.publishComponentReady();
        }
    },

    loadModelNames: function () {
        return this._createPITypePicker().then({
            success: function (selectedType) {
                this.currentType = selectedType;
                return [selectedType.get('TypePath')];
            },
            scope: this
        });
    },

    getGridBoardConfig: function(options) {
        console.log('getGridBoardConfig',options);
        return this.callParent(arguments);
    },
    
    addGridBoard: function (options) {
        if (this.gridboard && this.piTypePicker && this.piTypePicker.rendered) {
            this.piTypePicker.up().remove(this.piTypePicker, false);
        }
        this.callParent(arguments);
    },

    getHeaderControls: function () {
        return this.callParent(arguments).concat(this.piTypePicker);
    },

    getFilterControlConfig: function () {
        return {
            blackListFields: ['PortfolioItemType'],
            whiteListFields: ['Milestones']
        };
    },

    getFieldPickerConfig: function () {
        var blackListedFields = [];

        if(!this.getContext().isFeatureEnabled('S74502_PI_DEPENDENCIES_ON_EDP')) {
            blackListedFields.push('PredecessorsAndSuccessors');
        }
        return _.merge(this.callParent(arguments), {
            boardFieldDefaults: (this.getSetting('fields') || '').split(','),
            boardFieldBlackList: ['Predecessors', 'Successors'].concat(blackListedFields),
            gridFieldBlackList: blackListedFields,
            margin: '3 9 14 0'
        });
    },
    
    getCardBoardColumns: function () {
        
        return this._getStates().then({
            success: function (states) {
                return this._buildColumns(states);
            },
            scope: this
        });
    },

    _buildColumns: function (states) {        
        if (!states.length) {
            return undefined;
        }

        var columns = [
            {
                columnHeaderConfig: {
                    headerTpl: 'No Entry'
                },
                value: null,
                plugins: ['rallycardboardcollapsiblecolumns'].concat(this.getCardBoardColumnPlugins(null))
            }
        ];
        
        var group_by_field = this.getSetting('groupByField') || "State";
        if ( group_by_field == "State" ) {
            columns = columns.concat(_.map(states, function (state) {
                return {
                    value: state.get('_ref'),
                    wipLimit: state.get('WIPLimit'),
                    enableWipLimit: true,
                    columnHeaderConfig: {
                        record: state,
                        fieldToDisplay: 'Name',
                        editable: false
                    },
                    plugins: ['rallycardboardcollapsiblecolumns'].concat(this.getCardBoardColumnPlugins(state))
                };
            }, this));
        } else {
            columns = columns.concat(_.map(states, function (state) {
                return {
                    value: state,
                    /*wipLimit: state.get('WIPLimit'),*/
                    enableWipLimit: true,
                    plugins: ['rallycardboardcollapsiblecolumns']
                };
            }, this));
        }
        
        return columns;
    },

    _getStates: function () {
        var deferred = Ext.create('Deft.Deferred');
        
        var group_by_field = this.getSetting('groupByField') || "State";
        if ( group_by_field == 'State' ) {
            this.stateStore = Ext.create('Rally.data.wsapi.Store', {
                model: Ext.identityFn('State'),
                context: this.getContext().getDataContext(),
                fetch: ['Name', 'WIPLimit', 'Description'],
                filters: [
                    {
                        property: 'TypeDef',
                        value: this.currentType.get('_ref')
                    },
                    {
                        property: 'Enabled',
                        value: true
                    }
                ],
                sorters: [
                    {
                        property: 'OrderIndex',
                        direction: 'ASC'
                    }
                ]
            });
            
            this.stateStore.load({
                callback: function(records, operation, success){
                    if (success){
                        deferred.resolve(records);
                    } else {
                        deferred.reject(operation);
                    }
                }
            });
        } else {
            Rally.data.ModelFactory.getModel({
                type: 'PortfolioItem',
                success: function(model) {
                    model.getField(group_by_field).getAllowedValueStore().load({
                        callback: function(records, operation, success) {
                            var column_names = Ext.Array.map(records, function(allowedValue) {
                                return allowedValue.get('StringValue');
                            });
                            
                            deferred.resolve(column_names);
                        }
                    });
                }
            });
        }
            
        return deferred.promise;
    },

    getCardBoardColumnPlugins: function (state) {
        return [];
    },

    getCardConfig: function () {
        return {};
    },

    getCardBoardConfig: function (options) {        
        var group_by_field = this.getSetting('groupByField') || "State";
                
        options = options || {};
        var currentTypePath = this.currentType.get('TypePath');
        var filters = [];

        if (this.getSetting('query')) {
            try {
                filters.push(Rally.data.QueryFilter.fromQueryString(this.getSetting('query')));
            } catch (e) {
                Rally.ui.notify.Notifier.showError({ message: e.message });
            }
        }

        return {
            attribute: group_by_field,
            cardConfig: _.merge({
                editable: true,
                showColorIcon: true
            }, this.getCardConfig()),
            columnConfig: {
                xtype: 'rallycardboardcolumn',
                enableWipLimit: true
            },
            columns: options.columns,
            ddGroup: currentTypePath,
            listeners: {
                load: this.publishComponentReady,
                cardupdated: this._publishContentUpdatedNoDashboardLayout,
                scope: this
            },
            plugins: [{ ptype: 'rallyfixedheadercardboard' }],
            storeConfig: {
                filters: filters,
                context: this.getContext().getDataContext()
            }
        };
    },

    getGridStoreConfig: function () {
        return { models: this.piTypePicker.getAllTypeNames() };
    },
    
    _createPITypePicker: function () {
        if (this.piTypePicker) {
            this.piTypePicker.destroy();
        }

        var deferred = new Deft.Deferred();

        this.piTypePicker = Ext.create('Rally.ui.combobox.PortfolioItemTypeComboBox', {
            preferenceName: 'portfolioitems' + this.stateName + '-typepicker',
            value: this.getSetting('type'),
            context: this.getContext(),
            listeners: {
                change: this._onTypeChange,
                ready: {
                    fn: function (picker) {
                        deferred.resolve(picker.getSelectedType());
                    },
                    single: true
                },
                scope: this
            }
        });

        return deferred.promise;
    },

    _onTypeChange: function (picker) {
        var newType = picker.getSelectedType();

        if (this._pickerTypeChanged(picker)) {
            this.currentType = newType;
            this.modelNames = [newType.get('TypePath')];
            this.gridboard.fireEvent('modeltypeschange', this.gridboard, [newType]);
        }
    },

    _pickerTypeChanged: function(picker){
        var newType = picker.getSelectedType();
        return newType && this.currentType && newType.get('_ref') !== this.currentType.get('_ref');
    },

    _publishContentUpdatedNoDashboardLayout: function () {
        this.fireEvent('contentupdated', { dashboardLayout: false });
    }
});