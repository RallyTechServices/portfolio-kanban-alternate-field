/**
 * Allows configuring of rows for the cardboard
 *
 *
 *      @example
 *      Ext.create('Ext.Container', {
 *          items: [{
 *              xtype: 'rowsettingsfield',
 *              value: {
 *                  show: true,
 *                  field: 'c_ClassofService'
 *              }
 *          }],
 *          renderTo: Ext.getBody().dom
 *      });
 *
 */
Ext.define('Rally.apps.common.RowSettingsField', {
    alias: 'widget.rowsettingsfield',
    extend: 'Ext.form.FieldContainer',
    requires: [
        'Rally.ui.CheckboxField',
        'Rally.ui.combobox.ComboBox',
        'Rally.ui.plugin.FieldValidationUi',
        'Rally.data.ModelFactory',
        'Rally.data.wsapi.ModelBuilder'
    ],

    mixins: {
        field: 'Ext.form.field.Field'
    },

    layout: 'hbox',

    cls: 'row-settings',

    config: {
        /**
         * @cfg {Object}
         *
         * The row settings value for this field
         */
        value: undefined,

        /**
         * @cfg {Function}
         * A function which should return true if the specified field should
         * be included in the list of available swimlane fields
         * @param {Rally.data.wsapi.Field} field
         */
        isAllowedFieldFn: Ext.emptyFn,

        /**
         * @cfg {Object[]}
         *
         * Array of objects with name and value keys to be used by the row combobox
         * [{'name': 'Blocked', 'value': 'Blocked'},{'name': 'Owner', 'value': 'Owner'}]
         */
        explicitFields: [],

        /**
         * @cfg {String[]}
         * Array of models for which to list fields for
         */
        modelNames: ['portfolioitem/feature'],

        /**
         * @cfg {String[]}
         * Array of field display names to show if found on at least 1 model, sortable and are not hidden
         */
        whiteListFields: []
    },

    initComponent: function() {
        this.callParent(arguments);

        this.mixins.field.initField.call(this);

        this.add([
            {
                xtype: 'rallycheckboxfield',
                name: 'showRows',
                boxLabel: '',
                margin: '0',
                submitValue: false,
                value: this.getValue().showRows,
                listeners: {
                    change: function(checkbox, checked) {
                        this.down('rallycombobox').setDisabled(!checked);
                    },
                    scope: this
                }
            },
            {
                xtype: 'rallycombobox',
                plugins: ['rallyfieldvalidationui'],
                name: 'rowsField',
                margin: '0 6px',
                width: 130,
                emptyText: 'Choose Field...',
                displayField: 'name',
                valueField: 'value',
                disabled: this.getValue().showRows !== 'true',
                editable: false,
                submitValue: false,
                storeType: 'Ext.data.Store',
                storeConfig: {
                    remoteFilter: false,
                    fields: ['name', 'value'],
                    data: []
                }
            }
        ]);

        this._loadModels();
    },

    _loadModels: function() {
        Rally.data.ModelFactory.getModels({
            types: this.getModelNames(),
            context: this.context,
            success: this._onModelsRetrieved,
            scope: this
        });
    },

    _onModelsRetrieved: function (models) {
        var fields = _.uniq(Ext.Array.merge(this.explicitFields, this._getRowableFields(_.values(models))), 'name');
        var combobox = this.down('rallycombobox');
        combobox.getStore().loadData(_.sortBy(fields, 'name'));
        combobox.setValue(this.getValue().rowsField);
        this.fireEvent('ready', this);
    },

    _getRowableFields: function (models) {
        var artifactModel = Rally.data.wsapi.ModelBuilder.buildCompositeArtifact(models, this.context),
            allFields = artifactModel.getFields(),
            rowableFields = _.filter(allFields, function (field) {
                var attr = field.attributeDefinition;
                return attr && !attr.Hidden && attr.Sortable &&
                    ((artifactModel.getModelsForField(field).length === models.length &&
                    this.isAllowedFieldFn(field)) || _.contains(this.whiteListFields, field.displayName));
            }, this);

        return _.map(rowableFields, function(field) {
            return {
                name: field.displayName,
                value: field.name
            };
        });
    },

    /**
     * When a form asks for the data this field represents,
     * give it the name of this field and the ref of the selected project (or an empty string).
     * Used when persisting the value of this field.
     * @return {Object}
     */
    getSubmitData: function() {
        var data = {},
            showField = this.down('rallycheckboxfield'),
            rowsField = this.down('rallycombobox'),
            showRows = showField.getValue() && !_.isEmpty(rowsField.getValue());
        data[showField.name] = showRows;
        if (showRows) {
            data[rowsField.name] = rowsField.getValue();
        }
        return data;
    },

    refreshWithNewModelType: function(type) {
        this.setModelNames([type]);
        this._loadModels();
    }
});
