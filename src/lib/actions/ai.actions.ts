"use server";

import { extractJSON, isNotCarFound } from "../utils";
import { aiService } from "./ai";




export const findCaByAI=async(carDescription:string)=>{
    const result=await aiService.searchAgent(carDescription)

    const notfound=isNotCarFound(result)

    if (notfound) throw new Error("No Car Found")

        return result

}

export const autoGenerateCar=async(carName:string)=>{
    const response=await aiService.generateCarAgents(carName)
    const parsedata=extractJSON(response)

    
return parsedata
}