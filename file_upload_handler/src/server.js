import express from 'express'
import multer from 'multer'

const app =express();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads')
    },
    filename: function (req, file, cb) {
      const uniquepreffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null,uniquepreffix + "-"+ file.originalname )
    }
  })

  function fileFilter (req, file, cb) {

    // The function should call `cb` with a boolean
    // to indicate if the file should be accepted
    const acceptFileType = ['video/mp4','image/png','image/jpeg'  ,'image/gif']
    if (acceptFileType.includes(file.mimetype )){
        // To accept the file pass `true`, like so:
        cb(null, true)
    }else{
        cb(new Error("invalid File type\nonly accpet" + acceptFileType ))
    }
    
    //cb(null, false)
  
    
  
    // You can always pass an error if something goes wrong:
    //cb(new Error('I don\'t have a clue!'))
  
  }
  
  var upload = multer({ storage: storage , 
    limits:{
      fileSize : 1024 * 1024 * 5, // 5MB
        },
        fileFilter : fileFilter})


app.get("/test_get", (req, res)=>{
    res.send("test_get");
})

app.post("/fileReceiver",upload.single('userFile'), (req, res)=>{
    

    console.log(req.file)
    console.log(req.body)
    res.send(req.file)
})

app.post('/multiFileReceiver', upload.array("userFile", 10), (req, res)=>{
    
    res.send("Multiple File received");
    console.log(req)

   
})


app.listen(8000, ()=>{
    console.log("listening on port 8000")
})
