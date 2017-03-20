/**
 * Allows configuration of wip and schedule state mapping for kanban columns
 *
 *      @example
 *      Ext.create('Ext.Container', {
 *          items: [{
 *              xtype: 'kanbancolumnsettingsfield',
 *              value: {}
 *          }],
 *          renderTo: Ext.getBody().dom
 *      });
 *
 */
Ext.define('Rally.apps.kanban.ColumnSettingsField', {
    extend: 'Ext.form.field.Base',
    alias: 'widget.kanbancolumnsettingsfield',
    plugins: ['rallyfieldvalidationui'],
    requires: [
        'Rally.ui.combobox.ComboBox',
        'Rally.ui.TextField',
        'Rally.ui.combobox.FieldValueComboBox',
        'Rally.ui.plugin.FieldValidationUi',
        'Rally.apps.kanban.ColumnCardFieldPicker'
    ],

    fieldSubTpl: '<div id="{id}" class="settings-grid"></div>',

    width: 600,
    cls: 'column-settings',

    config: {
        /**
         * @cfg {Object}
         *
         * The column settings value for this field
         */
        value: undefined,

        defaultCardFields: ''
    },

    onDestroy: function() {
        if (this._grid) {
            this._grid.destroy();
            delete this._grid;
        }
        this.callParent(arguments);
    },

    onRender: function() {
        this.callParent(arguments);

        this._store = Ext.create('Ext.data.Store', {
            fields: ['column', 'shown', 'wip', 'portfolioStateMapping', 'portfolioStateName', 'cardFields','ref','type'],
            data: []
        });
        this._buildGrid();

    },

    _buildGrid: function(){
        if (this._grid) {
            this._grid.destroy();
        }

        this._grid = Ext.create('Rally.ui.grid.Grid', {
            autoWidth: true,
            renderTo: this.inputEl,
            columnCfgs: this._getColumnCfgs(),
            showPagingToolbar: false,
            showRowActionsColumn: false,
            enableRanking: false,
            store: this._store,
            editingConfig: {
                publishMessages: false
            }
        });
        this._grid.on('validateedit', function(editor, e) {
            var field = editor.field || editor.editors && editor.editors.items && editor.editors.items.length > 0 &&
                editor.editors.items[0].field && editor.editors.items[0].field.name;
            if (field === "portfolioStateMapping"){
                e.record.set('portfolioStateName',  e && e.editorRecord && e.editorRecord.name || "-- No Mapping --");
                if (!e.record.get('shown') &&  e.editorRecord && e.editorRecord.name !== "-- No Mapping --"){e.record.set('shown', true)}
            }
            return true;
        });
    },
    _getColumnCfgs: function() {
        var modelType = this.modelType;

        var columns = [
            {
                text: 'Column',
                dataIndex: 'column',
                emptyCellText: 'None',
                flex: 2
            },
            {
                text: 'Show',
                dataIndex: 'shown',
                flex: 1,
                renderer: function (value) {
                    return value === true ? 'Yes' : 'No';
                },
                editor: {
                    xtype: 'rallycombobox',
                    displayField: 'name',
                    valueField: 'value',
                    editable: false,
                    storeType: 'Ext.data.Store',
                    storeConfig: {
                        remoteFilter: false,
                        fields: ['name', 'value'],
                        data: [
                            {'name': 'Yes', 'value': true},
                            {'name': 'No', 'value': false}
                        ]
                    }
                }
            },
            {
                text: 'WIP',
                dataIndex: 'wip',
                flex: 1,
                emptyCellText: '&#8734;',
                editor: {
                    xtype: 'rallytextfield',
                    maskRe: /[0-9]/,
                    validator: function (value) {
                        return (value === '' || (value > 0 && value <= 9999)) || 'WIP must be > 0 and < 9999.';
                    },
                    rawToValue: function (value) {
                        return value === '' ? value : parseInt(value, 10);
                    }
                }
            },
            {
                text:'ref',
                dataIndex:'ref',
                hidden:true
            },
            {
                text:'type',
                dataIndex:'type',
                hidden:true
            }];

        if (this.fieldName !== "State"){
            columns.push({
                text: 'Portfolio State Mapping',
                dataIndex: 'portfolioStateMapping',
                emptyCellText: '--No Mapping--',
                editable: false,
                flex: 2,
                editor: this._getPortfolioStateEditorConfig(modelType),
                renderer: function(v,m,r){
                    return r.get('portfolioStateName') || r.get('portfolioStateMapping');
                }
            });
        }

        if (this.shouldShowColumnLevelFieldPicker) {
            columns.push({
                text: 'Fields',
                dataIndex: 'cardFields',
                width: 300,
                tdCls: Rally.util.Test.toBrowserTestCssClass('cardfields', ''),
                renderer: this._getRendererForCardFields,
                scope: this,
                editor: {
                    xtype: 'kanbancolumncardfieldpicker',
                    cls: 'card-fields',
                    margin: 0,
                    modelTypes: ['UserStory', 'Defect'],
                    autoExpand: true,
                    alwaysExpanded: false,
                    hideTrigger: true,
                    fieldBlackList: ['DisplayColor'],
                    alwaysSelectedValues: ['FormattedID', 'Name', 'Owner'],
                    storeConfig: {
                        autoLoad: false
                    },
                    listeners: {
                        selectionchange: function (picker) {
                            picker.validate();
                        },
                        rightactionclick: this._updateColumnCardFieldSettings,
                        scope: this
                    }
                }
            });
        }
        return columns;
    },
    _getPortfolioStateEditorConfig: function(model){

        return {
            xtype: 'rallyfieldvaluecombobox',
            model: Ext.identityFn(model),
            field: 'State',
            disabled: false,
            listeners: {
                ready: function (combo) {
                    var noMapping = {};
                    noMapping[combo.displayField] = '-- No Mapping --';
                    noMapping[combo.valueField] = null;
                    combo.store.insert(0, [noMapping]);
                    combo.setValue(null);
                }
            }
        };
    },
    /**
     * When a form asks for the data this field represents,
     * give it the name of this field and the ref of the selected project (or an empty string).
     * Used when persisting the value of this field.
     * @return {Object}
     */
    getSubmitData: function() {
        var data = {};
        data[this.name] = Ext.JSON.encode(this._buildSettingValue());
        return data;
    },

    _getRendererForCardFields: function(fields) {
        var valWithoutPrefixes = [];
        Ext.Array.each(this._getCardFields(fields), function(field) {
            valWithoutPrefixes.push(field.replace(/^c_/, ''));
        });
        return valWithoutPrefixes.join(', ');
    },

    _getCardFields: function(fields) {
        if (Ext.isString(fields) && fields) {
            return fields.split(',');
        }
        var val = ['FormattedID','Name','Owner'];
        Ext.Array.each(fields, function (currentItem) {
            if (currentItem && currentItem.data && !Ext.Array.contains(val, currentItem.data.name)) {
                val.push(currentItem.data.name);
            }
        });
        return val;
    },

    _updateColumnCardFieldSettings: function(picker, selectedRecord, value, initialText) {
        this._store.each(function(record) {
            if (record.get('shown')) {
                var cardFields = this._getCardFields(record.get('cardFields'));

                if (initialText) {
                    if (!Ext.Array.contains(cardFields, selectedRecord.get('name'))) {
                        cardFields.push(selectedRecord.get('name'));
                    }
                } else {
                    Ext.Array.remove(cardFields, selectedRecord.get('name'));
                }
                record.set('cardFields', cardFields.join(','));
            }
        }, this);

        this._store.loadRawData(this._store.getRange());
    },

    _buildSettingValue: function() {
        var columns = {};
        this._store.each(function(record) {
            if (record.get('shown')) {

                columns[record.get('column')] = {
                    ref: record.get('ref'),
                    type: record.get('type'),                    
                    wip: record.get('wip'),
                    portfolioStateMapping: record.get('portfolioStateMapping'),
                    portfolioStateName: record.get('portfolioStateName')
                };
             //   console.log(record.get('column'), record.get('portfolioStateMapping'), record.get('portfolioStateName'));
                if (this.shouldShowColumnLevelFieldPicker) {
                    var cardFields = this._getCardFields(record.get('cardFields'));
                    columns[record.get('column')].cardFields = cardFields.join(',');
                }
            }
        }, this);
        //console.log('_buildSettingValue',columns);
        return columns;
    },

    getErrors: function() {
        var errors = [];
        if (this._storeLoaded && !Ext.Object.getSize(this._buildSettingValue())) {
            errors.push('At least one column must be shown.');
        }
        return errors;
    },

    setValue: function(value) {
        this.callParent(arguments);
        this._value = value;
    },

    _getColumnValue: function(columnName) {
        var value = this._value;
        return value && Ext.JSON.decode(value)[columnName];
    },

    refreshWithNewField: function(field) {
        delete this._storeLoaded;
        var previousField = this.fieldName;
        this.fieldName = field && field.name;

        this._refreshMappingEditor(this.modelType);

        field.getAllowedValueStore().load({
            callback: function(records, operation, success) {
                var data = Ext.Array.map(records, this._recordToGridRow, this);
                this._store.loadRawData(data);
                this.fireEvent('ready');
                if (this.fieldName === 'State' || previousField === "State"){
                    //we need to rebuild the grid
                    this._buildGrid();
                }
                this._storeLoaded = true;
            },
            scope: this
        });
    },
    _refreshMappingEditor: function(model){

        if (this._grid && this._grid.columns){
            Ext.Array.each(this._grid.columns, function(c){
                if (c.dataIndex === 'portfolioStateMapping'){ //} && c.editor){
                    c.setEditor(this._getPortfolioStateEditorConfig(model));
                    return false;
                }
            }, this);
        }
    },
    refreshWithNewModel: function(model){
        console.log('refreshWithNewModel', model, this.modelType);
        if (model !== this.modelType){
            console.log('refreshWithNewModel', model, this.modelType,  this.fieldName);
            this._refreshMappingEditor(model);

            //if (this.modelType){
                this.modelType = model;

                this._store.each(function(r){
                    r.set('portfolioStateMapping', '');
                    r.set('portfolioStateName', '');
                    r.save();
                });
            //}

        }

    },
    _recordToGridRow: function(allowedValue) {
        var columnName = allowedValue.get('StringValue');
        var pref = this._store.getCount() === 0 ? this._getColumnValue(columnName) : null;
        //console.log('_recordToGridRow', columnName, pref);

        var column = {
            column: columnName,
            ref: allowedValue.get('_ref') != "null" ? allowedValue.get('_ref') : null,
            type: allowedValue.get('_type'),
            shown: false,
            wip: '',
            portfolioStateMapping: '',
            portfolioStateName: '',
            cardFields: this.defaultCardFields
        };

        if (pref) {

            Ext.apply(column, {
                shown: true,
                wip: pref.wip,
                portfolioStateMapping: pref.portfolioStateMapping,
                portfolioStateName: pref.portfolioStateName
            });

            if (pref.cardFields) {
                Ext.apply(column, {
                    cardFields: pref.cardFields
                });
            }
            //console.log('pref', column);
        }

        return column;

    }
});
