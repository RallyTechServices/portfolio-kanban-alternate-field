Ext.override(Ext.grid.plugin.CellEditing,{

    onEditComplete : function(ed, value, startValue) {
        var me = this,
            activeColumn = me.getActiveColumn(),
            context = me.context,
            record;

        if (activeColumn) {
            record = context.record;
            //Overriding to save the record so we can set the name, too.
            context.editorRecord = me.activeEditor.field && me.activeEditor.field.getRecord &&
                    me.activeEditor.field.getRecord() &&
                    me.activeEditor.field.getRecord().getData() || {value: null, name: me.activeEditor.allowBlankText };

            me.setActiveEditor(null);
            me.setActiveColumn(null);
            me.setActiveRecord(null);

            context.value = value;
            if (!me.validateEdit()) {
                me.editing = false;
                return;
            }

            // Only update the record if the new value is different than the
            // startValue. When the view refreshes its el will gain focus
            if (!record.isEqual(value, startValue)) {
                record.set(activeColumn.dataIndex, value);
            }

            // Restore focus back to the view.
            // Use delay so that if we are completing due to tabbing, we can cancel the focus task
            context.view.focusRow(context.rowIdx, 100);
            me.fireEvent('edit', me, context);
            me.editing = false;
        }
    }

});