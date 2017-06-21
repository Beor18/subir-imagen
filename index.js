var express = require("express");
var app = express();

var fs = require("fs");

var multer = require("multer");
var upload = multer({dest: "./uploads"});

var mongoose = require("mongoose");

mongoose.connect("mongodb://localhost/images");
var conn = mongoose.connection;

var gfs;

var Grid = require("gridfs-stream");
Grid.mongo = mongoose.mongo;

conn.once("open", function(){
  gfs = Grid(conn.db);
  app.get("/", function(req,res){
    //renders a multipart/form-data form
    res.render("home");
  });

  //segundo parametro es multer.
  app.post("/", upload.single("avatar"), function(req, res, next){
    var writestream = gfs.createWriteStream({
      filename: req.file.originalname
    });
    //
    fs.createReadStream("./uploads/" + req.file.filename)
      .on("end", function(){fs.unlink("./uploads/"+ req.file.filename, function(err){res.send("success")})})
        .on("err", function(){res.send("Error al subir imagen")})
          .pipe(writestream);
  });

  // envio imagen por filename.
  app.get("/:filename", function(req, res){
      var readstream = gfs.createReadStream({filename: req.params.filename});
      readstream.on("error", function(err){
        res.send("No image found with that title");
      });
      readstream.pipe(res);
  });

  //borrar imagen
  app.get("/delete/:filename", function(req, res){
    gfs.exist({filename: req.params.filename}, function(err, found){
      if(err) return res.send("ocurrio error");
      if(found){
        gfs.remove({filename: req.params.filename}, function(err){
          if(err) return res.send("Error occured");
          res.send("Imagen borrada");
        });
      } else{
        res.send("No se encontro");
      }
    });
  });
});

app.set("view engine", "ejs");
app.set("views", "./views");



if (!module.parent) {
  app.listen(3000);
}
