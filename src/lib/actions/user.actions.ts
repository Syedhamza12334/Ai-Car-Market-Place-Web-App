"use server"

import { unstable_cache as cache } from "next/cache"
import { prisma } from "../prisma"
import { auth } from "@/auth"
export const getMyProfile = cache(
    async (email: string | null | undefined) => {
        try {

            if (!email) return null
            const user = await prisma.user.findUnique({
                where: {
                    email,
                }
            })

            if (!user) return null
            return user
        } catch {

            return null

        }
    }, [], {
    revalidate: 60 * 60 * 24
}
)

export const getBookmarkcars=async()=>{


       const session = await auth()
    
        const Authuser = session?.user
    
        if (!Authuser) throw Error("User not Authenticated")
    
        const user = await getMyProfile(Authuser.email!)
    
    
        if (!user) throw Error("User not Found") 
    
        const cars = await prisma.car.findMany({
            where: {
                savedBy:{
                    some:{
                        id:user.id
                    }
                }
            },
         
            include:{
                specification:true,
                savedBy:{
                    select:{
                        id:true
                    }
                }
            }
    
        })
       return cars

}