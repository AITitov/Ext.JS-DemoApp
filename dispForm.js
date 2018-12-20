var paymentRequestWebUrl = "";
var paymentRequestID = Ext.Object.fromQueryString(location.search).ID; //ИД заявки
var listTitle = encodeURI("Заявки на оплату"); // Название списка, отформатированное для запросов в IE

Ext.onReady(function () {
    var fields = [];
    var web = new $pnp.Web(paymentRequestWebUrl);
    web.lists.getByTitle(listTitle).items.getById(paymentRequestID).get().then(function (item) {
        var fieldNameArray = GetFieldNameArray(item); // получение списка выводимых полей
        var grid = new VK.WebParts.DispForm({ // созданием компонента
            id:'dispFormPanel',
            renderTo: Ext.getBody(),
            webUrl: paymentRequestWebUrl,
            listTitle: listTitle,
            itemID: paymentRequestID,
            fields:fieldNameArray
        });
        addUserMultiField(grid,item,"Аудитория","Auditory",paymentRequestWebUrl);// заполнение поля аудитория
    });
});
// Функция создания списка выводимых полей
function GetFieldNameArray(item){
    var fieldNameArray = [];
    switch (item.Type) {
        case "Без основания": // без основания
            break;
        case "Договор": // по договору
            fieldNameArray.push("Contract");
            
            break;
        case "ДС": // по ДС
            fieldNameArray.push("DS");
            
            break;
        case "Закрывающий документ": // по закрывающему документу
            fieldNameArray.push("ClosingDoc");
            
            break;
    }
    fieldNameArray.push.apply(fieldNameArray, ["Note","Entity","CFO",
    "Counteragent","PaymentPlannedDate","PaymentActualDate","PaymentSum","PaymentSumApproved","PaymentSumFact","Currency","PaymentType","PaymentPurpose"]);
    
    if(item.GeneralExpenses == false || item.GeneralExpenses == null)
        fieldNameArray.push("Project");
    else
        fieldNameArray.push("GeneralExpenses");
        
    if(item.VATFlag == false)
        fieldNameArray.push("VATRate");
    else
        fieldNameArray.push("VATFlag"); 
    
    fieldNameArray.push("PaymentNote");
    return fieldNameArray;
}