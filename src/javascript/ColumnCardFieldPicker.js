
/**
 * A picker which allows selecting one or more fields and a configurable right side action on bound list.
 */
Ext.define('Rally.apps.kanban.ColumnCardFieldPicker', {
    extend: 'Rally.ui.picker.FieldPicker',
    alias: 'widget.kanbancolumncardfieldpicker',
    margin: 0,

    config: {
        /**
         * @cfg {String}
         * Initial text shown on right side of bound list
         */
        rightInitialText: 'Apply to All',

        /**
         * @cfg {String}
         * Text shown on right side of bound list after click
         */
        rightUpdateText: 'Remove from All',

        /**
         * @cfg {String}
         * Class for right side of bound list
         */
        rightCls: 'rui-picker-right-action hyperlink'

    },


    initComponent: function() {
        this.addEvents(
            /**
             * @event rightactionclick
             * Fires when a right side text was clicked in the picker
             * @param {Rally.ui.picker.MultiObjectPicker} picker This picker
             * @param {Object} value The newly clicked value
             * @param {Object[]} values The currently selected values
             * @param {Ext.Element} The element clicked
             */
            'rightactionclick'
        );
        this.applyToAllFields = [];
        this.callParent(arguments);
    },

    onListItemDeselect: function(record, event, itemEl) {
        var rightActionEl = this._getRightActionEl(record);

        if (rightActionEl && event.within(rightActionEl)) {
            var initialTextClicked = rightActionEl.getHTML() === this.rightInitialText;
            this.fireEvent('rightactionclick', this, record, this.getValue(), initialTextClicked);

            if (initialTextClicked) {
                this.applyToAllFields.push(record.get(this.selectionKey));
                this._selectRowCheckbox(record.get(this.recordKey));
                rightActionEl.update(this.rightUpdateText);
                return false;
            } else {
                Ext.Array.remove(this.applyToAllFields, record.get(this.selectionKey));
                rightActionEl.update(this.rightInitialText);
            }
        } else {
            Ext.Array.remove(this.applyToAllFields, record.get(this.selectionKey));
        }
        this.callParent(arguments);
    },

    getRightListHtml: function(recordData) {
        var tpl = '';
        if (recordData.groupSelected === 'Selected Fields' &&
            !Ext.Array.contains(this.alwaysSelectedValues, recordData[this.selectionKey])) {
            var text = Ext.Array.contains(this.applyToAllFields, recordData[this.selectionKey]) ? this.rightUpdateText: this.rightInitialText;
            tpl = '<div class="' + this.rightCls + '">' + text + '</div>';
        }
        return tpl;
    },

    _getRightActionEl: function(record) {
        var rightSelector = Ext.String.splitWords(this.rightCls).join('.');
        return this.list.getEl().down('.rui-multi-object-picker-option-id-' + record.get(this.recordKey) + ' .' + rightSelector);
    }

});