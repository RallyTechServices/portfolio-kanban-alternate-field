/**
 * @private
 * Shows the Kanban Policy for a Portfolio Item board, based on the State representing the column.
 * Used by the Rally.ui.cardboard.KanbanColumn
 */
Ext.define('Rally.apps.portfoliokanban.PortfolioKanbanPolicy', {
    extend: 'Rally.ui.cardboard.PolicyContainer',
    alias: 'widget.rallyportfoliokanbanpolicy',

    config: {
        /**
         * @cfg {Rally.data.wsapi.Model} (required)
         * The Kanban State record that holds the policy information.
         */
        stateRecord: undefined
    },

    canEditPolicy: function() {
        return this.getStateRecord().get('updatable');
    },

    getPolicyText: function() {
        return this.getStateRecord() && this.getStateRecord().get('Description');
    },

    draw: function() {
        if (this.getStateRecord()) {
            this.callParent(arguments);
        } else {
            this._drawNotApplicable();
        }
    },

    _drawNotApplicable: function() {
        this.add({
            xtype: 'component',
            renderTpl: '<div class="policyContent">Not Applicable</div>'
        });
    },

    onEditClick: function() {
        Ext.create('Rally.ui.dialog.RichTextDialog', {
            title: 'Edit the Exit Policy for "' + this.getStateRecord().get('Name') + '" Column',
            headerItems: [
                {
                    xtype: 'component',
                    cls: 'kanbanPolicyRichTextEditorHeader',
                    html: 'What needs to be done before an item is ready to leave this column?'
                }
            ],
            autoShow: true,
            record: this.getStateRecord(),
            fieldName: 'Description',
            editorMaxHeight: 500,
            listeners: {
                save: this.drawPolicy,
                scope: this
            }
        });
    }
});