Ext.define('RallyTechServices.portfolioalternatekanbanboard.Toolbox',{
    fetchObjectByRef: function(ref){
        var refParts = ref.split('/');
        Ext.create('Rally.data.wsapi.Store',{
            model: refParts[0],
            fetch: true,
            filters: [{
                property: 'ObjectID',
                value: refParts[1]
            }]
        }).load({
            callback: function(records, operation){
                console.log('records', records);
            }
        });
    }
});