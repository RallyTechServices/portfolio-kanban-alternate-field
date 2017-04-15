Ext.override(Rally.ui.AddNew, {

        _getFieldConfigs: function() {

            var newLabel = this.fieldLabel;

            var items = [{
                itemId: 'label',
                xtype: 'label',
                text: newLabel
            }];

            if (this._showRecordTypes()) {
                var data = _.map(this.recordTypes, function(recordType) {
                    return {
                        type: recordType,
                        displayName: recordType
                    };
                }, this);

                var comboCfg = Ext.merge({
                    itemId: 'type',
                    xtype: 'rallycombobox',
                    flex: 1,
                    minWidth: 50,
                    maxWidth: 100,
                    matchFieldWidth: true,
                    store: {
                        fields: ['type', 'displayName'],
                        data: data
                    },
                    listeners: {
                        change: this._onRecordTypeChanged,
                        scope: this
                    },
                    valueField: 'type',
                    displayField: 'displayName',
                    value: this.recordTypes[0],
                    queryMode: 'local',
                    editable: false
                }, this.comboCfg || {});

                items.push(comboCfg);
            }

            if(this.showNameField) {
                items.push({
                    itemId: 'nameField',
                    xtype: 'rallytextfield',
                    plugins: [
                        'rallyfieldvalidationui'
                    ],
                    emptyText: 'Name',
                    flex: 1,
                    minWidth: 100,
                    maxWidth: 300,
                    enableKeyEvents: true,
                    listeners: {
                        specialKey: this._onTextFieldSpecialKey,
                        keyup: this.toggleAddButton,
                        scope: this
                    }
                });
            }
            return items;
        }
    });

