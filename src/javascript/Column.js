Ext.define('Rally.apps.kanban.Column', {
    extend: 'Rally.ui.cardboard.Column',
    alias: 'widget.kanbancolumn',

    config: {
        hideReleasedCards: false
    },

    getStoreFilter: function (model) {
        var filters = [];
        Ext.Array.push(filters, this.callParent(arguments));
        if (model.elementName === 'HierarchicalRequirement') {
            if (this.context.getSubscription().StoryHierarchyEnabled) {
                filters.push({
                    property: 'DirectChildrenCount',
                    value: 0
                });
            }
        }

        if (this.hideReleasedCards) {
            filters.push({
                property: 'Release',
                value: null
            });
        }

        return filters;
    }
});
