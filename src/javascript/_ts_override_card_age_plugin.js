/**
 * @private
 * Displays the result of calculated fields on a card
 * 
 * Override to change display
 * 
 */
Ext.override(Rally.ui.cardboard.plugin.CardAge, {
    
    _addField: function() {
        var me = this,
            cmp = me.cmp;

        this.cmp.addField({
            name: cmp.ageFieldName,
            renderTpl: function() {
                var age = me._getAge();
                if (age >= cmp.showAge) {
                    return [
                        '<div class="', [cmp.ageFieldName, 'timeInState'].join(' '), '">',
                            '<span>',
                                age.toString(),
                                ' ',
                                Ext.util.Inflector.pluralize(cmp.ageIntervalUnit),
                            ' in this column</span>',
                        '</div>'
                    ].join('');
                }
                return '';
            },
            isStatus: true,
            hasValue: function() {
                var record = cmp.getRecord();
                return record.raw[cmp.ageFieldName] !== undefined || record.get(cmp.ageFieldName);
            }
        });
    }
});

Ext.override(Rally.ui.cardboard.CardBoard, {
    _createRow: function(rowConfig, applySort) {
        var collapsed = false;
        if (this.rowConfig && this.rowConfig.field && this.state && this.state.collapsedRows) {
            var rowKey = this._getRowKey(this.rowConfig.field, rowConfig.value);
            collapsed = this.state.collapsedRows.hasOwnProperty(rowKey);
        }

        var defaultRowConfig = {
            el: this.getEl().down('tbody.columns'),
            columns: this.columnDefinitions,
            context: this.getAppContextOrEnvironmentContext(),
            fieldDef: this.rowConfig && this.rowConfig.fieldDef,
            collapsed: collapsed
        };

        if (this.rowConfig) {
            if(this.rowConfig.headerConfig) {
                defaultRowConfig.headerConfig = this.rowConfig.headerConfig;
            }
            if(this.rowConfig.sortField) {
                defaultRowConfig.sortField = this.rowConfig.sortField;
            }
        }

        var row = Ext.create('Rally.ui.cardboard.row.Row',
            Ext.apply(defaultRowConfig, rowConfig)),
            sortIndex = applySort ? this._getSortedIndex(row) : this.rowDefinitions.length;
        this.rowDefinitions.splice(sortIndex, 0, row);
        row.insert(this.rowDefinitions[sortIndex + 1]);

        if(row.isCollapsible()) {
            row.on('collapse', this.saveState, this);
            row.on('expand', this.saveState, this);
        }
        return row;
    },
        _onColumnReady: function (column, records) {
            this._columnsLoaded = this._columnsLoaded || 0;
            this._columnsLoaded++;
            this.fireEvent('columnready', column, this);
            if (this._columnsLoaded === this.columnDefinitions.length) {
                this._onAllColumnsReady();

                if(!this.getRows().length) {
                    if(this.rowConfig) {
                        this._createRow({
                            showHeader: true,
                            value: null,
                            isBlankSlate: true
                        });
                    } else {
                        this._createDefaultRow();
                    }
                }
            }
        }

});