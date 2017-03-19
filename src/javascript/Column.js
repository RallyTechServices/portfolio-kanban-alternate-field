Ext.define('Rally.apps.kanban.Column', {
    extend: 'Rally.ui.cardboard.Column',
    alias: 'widget.kanbancolumn',

    config: {
        hideReleasedCards: false
    },

    getStoreFilter: function (model) {
        var filters = [];

        Ext.Array.push(filters, this.callParent(arguments));

        if (this.hideReleasedCards) {
            filters = filters.and({
                property: 'Release',
                value: null
            });
        }
        return filters;
    }
});
