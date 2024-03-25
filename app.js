import bcrypt from 'bcrypt'
import express, { query }  from 'express'
import mysql from 'mysql2'
import cors  from 'cors'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import { GoogleGenerativeAI } from '@google/generative-ai'




const salt = 10;


const app = express();


app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(cors(
    {
        origin: ["http://localhost:5173"],
        methods:["POST","GET"],
        credentials: true
    }
    )); 
    app.use(cookieParser())
    
    
    
    const db = mysql.createConnection({
        host:"localhost",
        user:"root",
        password:"Poiuty65@",
        database:"jobportal"
    })
    
    
const port = 3001;



app.post('/analyzer',(req,res)=>{
    
 const gemini_api_key = 'AIzaSyCpRHVQUhMYNPoPN4d_3FzUpIHgXIha5iw';

    const googleAI = new GoogleGenerativeAI(gemini_api_key);

const geminiConfig = {
    temperature: 0.5, // Controls randomness (0 = deterministic, 1 = random)
    topP: 1, // Probability of picking the most likely word
    topK: 1, // Consider only the top K most likely words
    maxOutputTokens: 40, // Maximum number of words to generate
};

const geminiModel = googleAI.getGenerativeModel({ model: "gemini-pro", geminiConfig });

async function generateTextWithGemini(prompt) {
    try {
        const result = await geminiModel.generateContent(prompt);
        
        const generatedText = result.response.text();
        res.json({message: generatedText})
        
        console.log(generatedText)
        
        
    } catch (error) {
        console.error('Error:', error);
    }
}
const prompt = req.body.message;


generateTextWithGemini(prompt+ " suggest me 10 jobs on these skills sentence not more than 10 words ")

})







db.connect((err)=>{
    if(err) return console.log(err)
    return console.log("connected to jobportal database")
})

const verifyUser = (req,res,next)=>{
    const token = req.cookies.token;
    if (!token) {
        return res.json({Error: 'you are not authenticated'})
    }else{
        jwt.verify(token,"jwt-secret-key",(err,decoded)=>{
            if (err) {
                return res.json({Error:"token is not okey"});
            }else{
                req.name = decoded.name;
               
                next();
            }
        })
    }
}

app.get('/',verifyUser,(req,res)=>{
    
    return res.json({Status:"Success",name: req.name});
})



app.get('/userprofile',(req,res)=>{
    
})    




app.get("/user",(req,res)=>{
    const q = "select * from user"
    db.query(q,(err,data)=>{
        res.send(data)
    })    
})    
// app.post("/signup",(req,res)=>{
    //     const q = "insert into user (`ID`,`Name`,`Address`,`Phone`,`Email`,`DOB`) values (?)";    
    //     const values =[
        //         req.body.ID,    
        //         req.body.Name,
        //         req.body.Address,
        //         req.body.Phone,
        //         req.body.Email,
        //         req.body.DOB
        
        //     ];
        
        //     db.query(q,[values],(err,data)=>{
            //         if(err) return res.json(err);    
            //         return res.json("User have been registered successfully")
            //     })
            
            // })
            //---------------------------------------------------------------------------------------------------------------
            app.post("/signup",(req,res)=>{
                
                const sql = 'SELECT * FROM musersignup WHERE EMAIL=(?)';
                
                
      db.query(sql,[req.body.Email],(err,data)=>{
    
          if (req.body.Email === data.Email) { 
            
              
              return res.json({Error: 'Email already existed '})
          }
          else{
              bcrypt.hash(req.body.Password.toString(),salt,(err,hash)=>{
                  if(err) return res.json({Error:"Error for hasing Password"})
              
                  const sql = "insert into musersignup (`Email`,`Username`,`Password`,`Role`) values (?,?,?,?)";
          
                  const values = [
                      req.body.Email,
                      req.body.Username,
                      hash,
                      req.body.Role,
                  ]
              
                  db.query(sql,values,(err,result)=>{
                      if (err) {
                          console.error('Error inserting data:', err);
                          return res.json({ Error: 'Error inserting data in server', details: err.message });
                        }
                        return res.json({ Status: 'Success' });
                       
                  })
              })
          
          }
      })
      
    })
    
    //-----------------------------------------------------------------------------------------------------------
    app.post('/login',(req,res)=>{
    const sql = 'SELECT * FROM musersignup WHERE EMAIL=(?)' ;
    db.query(sql,[req.body.Email],(err,data)=>{
        console.log(data)
        if(err){
            res.json({Error:"Login error in server"});
        }    

        if(data.length > 0){
            
            bcrypt.compare(req.body.Password.toString().trim(), data[0].Password,(err, response) => {         
                if(err) return res.json({Error:"password compare error"});
                if(response) {
                    const name = data[0].Username;
                    
                   
                    const token = jwt.sign({name},"jwt-secret-key",{expiresIn:'1d'});
                    res.cookie('token',token);
                    console.log(data[0].Username)
                    
                    return res.json({Status:"Success",Role: data[0].Role,isLoggedIn: true});
                    
                }else{
                    return res.json({Error:"password not matched"})
                    
                }    
            })     
        }else{
            res.json({Error:"no email existed"})
        }    

    })    
})    



app.get("/logout",(req,res)=>{
    res.clearCookie('token');
    return res.json({Status: "Success"})
})






  



app.get("/",(req,res)=>{
    res.send("this is backedn")
})

app.listen(port,()=>{
    console.log("app is listing")
})