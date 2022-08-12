const { request, response } = require("express");
const express = require("express");
const {v4 : uuidv4} = require("uuid");

const app = express();
app.use(express.json());


const custumers = [];

//middlewares

function VerifyIfExistsAccountCPF(request, response, next) {
    const {cpf} = request.headers;

    const custumer = custumers.find((custumer => custumer.cpf === cpf));
    
    if(!custumer){
        return response.status(400).json({error : ("Custumer Not Found!!")});
    };
    
    request.custumer = custumer;

    return next();
}

function getBalance(statement){
    
    const balance = statement.reduce((acc, operation) => {
        if(operation.type === 'credit'){
            return acc + operation.amount;
        }else{
            return acc - operation.amount;
        }
    },0);

    return balance;
}

app.post("/account", (request,response) =>{
    const {cpf, name} = request.body;
    const custumerAlreadyExists = custumers.some(
        (custumer) => custumer.cpf === cpf 
        );
    if(custumerAlreadyExists) {
        return response.status(400).json({ error: "Custumer Already Exist!!"});
    }
        
    custumers.push({
        cpf,
        name,
        id:uuidv4(),
        statement: []
    });

    return response.status(201).send();
});

//app.use(VerifyIfExistsAccountCPF);




app.get("/statement", VerifyIfExistsAccountCPF, (request,response) =>{
    //const {cpf} = request.headers;
    const {custumer} = request;
    //const custumer = custumers.find((custumer => custumer.cpf === cpf));

    return response.json(custumer.statement);

});

app.post("/deposit",VerifyIfExistsAccountCPF, (request,response) => {
    const {description, amount} = request.body;

    const {custumer} = request;

    const statementOperation = {
        description,
        amount,
        create_At: new Date(),
        type: "credit",
    };

    custumer.statement.push(statementOperation);

    return response.status(201).send();
});

app.post("/withdraw", VerifyIfExistsAccountCPF,(request,response) => {

    const {amount} = request.body;
    const {custumer} = request;
    const balance = getBalance(custumer.statement);

    if(balance < amount){
        response.status(400).json({error:"Insuficient Funds!"})
    };

    const statementOperation = {
        amount,
        create_At: new Date(),
        type: "debit",
    };

    custumer.statement.push(statementOperation);

    return response.status(201).send();
});

app.listen(3333);