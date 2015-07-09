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