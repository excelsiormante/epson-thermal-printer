"use strict";

import express from 'express';
import thermal_printer from 'node-thermal-printer';
import printer from 'printer';
import cors from 'cors';
import datetime from 'node-datetime';
import bodyParser from 'body-parser';
import config from './config';

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.post('/', printReceipt);

console.log('thermal-printer now running on port 8080');
app.listen(8080)


function printReceipt(req, res) {
  const epson = printer.getPrinter(config.receipt.name);
  thermal_printer.init({
      type: config.receipt.type
  });
  thermal_printer.alignCenter();
  thermal_printer.println(config.receipt.header);
  thermal_printer.println(`TIN: ${config.receipt.tin}`);
  thermal_printer.newLine();
  thermal_printer.println('========================================');
  thermal_printer.println(datetime.create().format('M/d/Y H:M'));
  thermal_printer.println('Official Receipt');
  thermal_printer.newLine();
  thermal_printer.tableCustom([
    { text: 'Cashier: ', align:"LEFT", width: 0.50},
    { text: req.body.cashier, align:"LEFT", width: 0.25, bold:true}
  ]);
  thermal_printer.tableCustom([
    { text: 'Receipt #', align:"LEFT", width: 0.50},
    { text: padNumber(req.body.id, 12) , align:"LEFT", width: 0.25, bold:true}
  ]);
  thermal_printer.println('========================================');
  thermal_printer.alignLeft();
  thermal_printer.bold(true);
  thermal_printer.tableCustom([
    { text: 'QTY', align: 'LEFT', width: 0.10},
    { text: 'ITEM', align: 'LEFT', width: 0.50},
    { text: 'PRICE', align: 'RIGHT', width: 0.20}
  ]);
  thermal_printer.bold(false);
  thermal_printer.newLine();
  const merchandise = req.body.merchandise
  Object.keys(merchandise).forEach(function(key){
    const totalAmount = typeof(merchandise[key].total_price) == 'string' ? parseFloat(merchandise[key].total_price).toFixed(2) : merchandise[key].total_price.toFixed(2);
    thermal_printer.tableCustom([
      { text: merchandise[key].quantity,
        align:"LEFT", 
        width: 0.10
      },
      { text: merchandise[key].name,
        align:"LEFT", 
        width: 0.50
      },
      { 
        text: totalAmount,
        align:"LEFT", 
        width: 0.20 
      }
    ]);
  });
  thermal_printer.println('========================================');
  thermal_printer.tableCustom([
    { text: 'TOTAL', align:"LEFT", width: 0.50},
    { text: req.body.amount.toFixed(2) , align:"RIGHT", width: 0.25, bold:true}
  ]);
  thermal_printer.tableCustom([
    { text: 'CASH', align:"LEFT", width: 0.50},
    { text: req.body.payment.toFixed(2) , align:"RIGHT", width: 0.25, bold:true}
  ]);
  thermal_printer.tableCustom([
    { text: 'CHANGE', align:"LEFT", width: 0.50},
    { text: req.body.change.toFixed(2) , align:"RIGHT", width: 0.25, bold:true}
  ]);
  thermal_printer.println('========================================');
  thermal_printer.println('Summary');
  thermal_printer.newLine();
  thermal_printer.tableCustom([
    { text: 'Vatable Sales :', align:"LEFT", width: 0.50},
    { text: 'xxx' , align:"RIGHT", width: 0.25, bold:true}
  ]);
  thermal_printer.tableCustom([
    { text: 'VAT-Exempt Sales :', align:"LEFT", width: 0.50},
    { text: 'xxx' , align:"RIGHT", width: 0.25, bold:true}
  ]);
  thermal_printer.tableCustom([
    { text: 'Zero Rated Sales :', align:"LEFT", width: 0.50},
    { text: 'xxx' , align:"RIGHT", width: 0.25, bold:true}
  ]);
  thermal_printer.newLine();
  thermal_printer.println('Name: __________________________________');
  thermal_printer.println('Address: _______________________________');
  thermal_printer.println('TIN: ___________________________________');
  thermal_printer.println('Business Style: ________________________');
  thermal_printer.newLine();
  thermal_printer.alignCenter();
  thermal_printer.println('This serves as an official receipt');
  thermal_printer.println('Thank you!');
  thermal_printer.cut();

  printer.printDirect({
      data: thermal_printer.getBuffer(),
      printer: epson.name,
      type: "RAW",
      success: function(job_id){
          res.send({
            status: 'success',
            message: 'job_id: '+job_id+'successfully printed' 
          });
      },
      error: function(err){
          res.send({
            status: 'failed',
            message: err
          });
      }
  });

  thermal_printer.clear();
};


function padNumber(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}