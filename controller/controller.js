import {SignupCollection, LoginCollection} from "../model/model.js";

export const signup = async(req, res) => {
    try{
        const data = new SignupCollection(req.body)
        await data.save()
        res.status(201).json({"Account Created": "Successfully"})
    }
    catch(err){
        res.status(400).json({error:err.message})
    }

}

// export const login = async(req, res) => {
//     try{
//         const data = new LoginCollection(req.body)
//         await data.save()
//         res.status(201).json({"Account Created": "Successfully"})
//     }
//     catch(err){
//         res.status(400).json({error:err.message})
//     }

// }