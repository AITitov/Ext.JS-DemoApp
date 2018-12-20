Ext.onReady(function () {
    var paymentRequestWebUrl = "https://portal/sites/Treasury";
    //var paymentRequestID = Ext.Object.fromQueryString(location.search).ID;
	var paymentRequestID = 764;

    var editForm = new VK.WebParts.EditForm({
        renderTo: Ext.getElementById("paymentRequestPropertiesContainer"),
        webUrl: paymentRequestWebUrl,
        listTitle: "Заявки на оплату",
        itemID: paymentRequestID,
        //fields:["Contract","Note","PaymentType","PaymentPlannedDate","Entity","Project","CFO","PaymentStatus","PaymentSum"]
        fields:["Note","VATFlag","VATRate","PaymentType","PaymentPlannedDate","PaymentPurpose","Auditory"]
    });
    // Основной контейнер
    var mainContainer = Ext.create('Ext.container.Viewport', {
        items: [editForm],
        layout: {
            type: 'hbox',
            align: 'stretch'
        },
    });
});
