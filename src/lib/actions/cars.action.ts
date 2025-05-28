"use server"

import { auth } from "@/auth";
import { AddCarSchema, ContactSellerSchema } from "../zod";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { carTypes } from "@/constants/car";
import { CarType } from "@prisma/client";
import { unstable_cache as cache } from "next/cache"

export const generatImage = async (text: string, name: string) => {
    try {
        const encodedText = encodeURIComponent(text)
        const ImagePath = `${name}.jpg`;

        const URL_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL;
        if (!URL_ENDPOINT) throw new Error("URL_ENDPOINT is not defined")
        const url = `${URL_ENDPOINT}/ik-genimg-prompt-${encodedText}/${ImagePath}`;

        const Privatekey = process.env.IMAGEKIT_PRIVATE_KEY;

        if (!Privatekey) throw new Error("Private key is not defined")

        const base64key = btoa(Privatekey + ":")

        const res = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${base64key}`
            }
        })

        if (!res.ok) throw new Error("Failed to generate Image")
        const blob = await res.blob()
        const buffer = await blob.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64")

        return {
            base64Data: `data:image/jpeg;base64,${base64}`,
            name: ImagePath
        }
    } catch (error) {
        console.log('errror', error);
        throw new Error("Failed to generate Image")

    }
}

export const addNewCar = async (carData: AddCarSchema) => {
    const session = await auth()
    const authUser = session?.user
    if (!authUser) throw Error("user not authenticated")

    const user = await prisma.user.findUnique({
        where: {
            email: authUser.email,
        }
    })

    if (!user) throw Error("user not Found")

    await prisma.$transaction(async (tx) => {
        const {
            name,
            brand,
            type,
            year,
            mileage,
            colors,
            price,
            description,
            images,
            features,
            location,
            fuelType,
        } = carData;

        const car = await tx.car.create({
            data: {
                name,
                brand,
                type,
                year,
                mileage,
                colors,
                price,
                description,
                images,
                features,
                location,
                fuelType,
                userId: user?.id
            },
        });


        console.log('user found', user);


        const {
            sellerAddress,
            sellerCity,
            sellerCountry,
            sellerEmail,
            sellerName,
            sellerPhone,
            sellerState,
            sellerWebsite,
            sellerZip,
            sellerImage,
        } = carData;


        await tx.carSeller.create({
            data: {
                address: sellerAddress,
                city: sellerCity,
                country: sellerCountry,
                email: sellerEmail,
                name: sellerName,
                phone: sellerPhone,
                state: sellerState,
                website: sellerWebsite,
                postalCode: sellerZip,
                image: sellerImage,
                carId: car.id,
            },
        });
        const {
            engineCapacity,
            doors,
            seats,
            topSpeed,
            acceleration,
            horsepower,
            torque,
            length,
            width,
            height,
            weight,
        } = carData;

        await tx.carSpecification.create({
            data: {
                engineCapacity,
                doors,
                seats,
                topSpeed,
                acceleration,
                horsepower,
                torque,
                length,
                width,
                height,
                weight,
                carId: car.id,
            },
        });

        return car


    });
    console.log("Car added successfully");
    revalidatePath("/");


}



export const getAllCars = cache(
    async () => {
        const cars = await prisma.car.findMany({
            orderBy: {
                createdAt: "desc"
            },
            select: {
                id: true
            }
        });

        return cars
    },
    ["cars"], {
    revalidate: 60 * 60 * 24
}
)




export const getAllCarsForAi = cache(
    async () => {
        const cars = await prisma.car.findMany({
            orderBy: {
                createdAt: "desc"
            },
        });

        return cars
    },
    ["cars"], {
    revalidate: 60 * 60 * 24
}
)

// export const getCars = cache(async ({
//     page = 1,
//     type = "all",
//     modelname="",
//     price="",
// }: {
//     page?: Number;
//     type?: String
//     modelname?:String,
//     price?:String
// }) => {

//     // console.log('modelname',modelname);
//     // console.log('price',price);
    
//     const limit = 8;
//     const offset = (page - 1) * limit;
//     await new Promise((resolve) => setTimeout(resolve, 4000))
//     const allowedtypes = type.split(",").filter(Boolean).map((t) => t.toUpperCase()) as [];

//     const isavalidtype = allowedtypes.some((t) => carTypes.includes(t as CarType) || t === "all")

//     const cars = await prisma.car.findMany({
//         skip: offset,
//         take: limit,
//         where: {
//             ...(type !== 'all' && isavalidtype && {
//                 type: { in: allowedtypes }
//             }),
//         },
//         orderBy: {
//             createdAt: "desc"
//         }
//     })
//     return cars
// }, [], {
//     revalidate: 60 * 60 * 24
// })


export const getCars = cache(async ({
  page = 1,
  type = "all",
  modelname = "",
  price = "",
}: {
  page?: number;
  type?: string;
  modelname?: string;
  price?: string;
}) => {
  const limit = 8;
  const offset = (page - 1) * limit;

  console.log('price',price);
    console.log('modelname',modelname);
  

  await new Promise((resolve) => setTimeout(resolve, 4000));

  const allowedTypes = type.split(",").filter(Boolean).map((t) => t.toUpperCase()) as [];

  const isValidType = allowedTypes.some(
    (t) => carTypes.includes(t as CarType) || t === "all"
  );

  // 🔍 Build Prisma `where` clause
//   const whereClause: any = {};
const whereClause: Record<string, unknown> = {};

  // Filter by type
  if (type !== "all" && isValidType) {
    whereClause.type = { in: allowedTypes };
  }

  // Filter by modelname (partial match)
  if (modelname) {
    whereClause.name = {
      contains: modelname,
      mode: "insensitive",
    };
  }

  // Filter by price range
  if (price) {
    const [min, max] = price.split("-");

    if (max) {
      // Price is a range like 20000-30000
      whereClause.price = {
        gte: parseFloat(min),
        lte: parseFloat(max),
      };
    } else if (min.endsWith("+")) {
      // Price is 30000+
      const minValue = parseFloat(min.replace("+", ""));
      whereClause.price = {
        gte: minValue,
      };
    }
  }

  console.log('whereClause',whereClause);
  

  const cars = await prisma.car.findMany({
    skip: offset,
    take: limit,
    where: whereClause,
    orderBy: {
      createdAt: "desc",
    },
  });

  return cars;
}, [], {
  revalidate: 60 * 60 * 24,
});



export const getCarById = cache(async (id: string) => {

    const car = await prisma.car.findUnique({
        where: {
            id,
        },
        include: {
            specification: true,
            savedBy: {
                select: {
                    id: true
                }
            }
        }
    });

    if (!car) return null
    return car

}, [], {
    revalidate: 60 * 60 * 24
})




export const getSellerInfo = cache(async (carId: string) => {

    const seller = await prisma.carSeller.findUnique({
        where: {
            carId,
        },

    });

    if (!seller) throw new Error("seller not found")
    return seller

}, [], {
    revalidate: 60 * 60 * 24
})

export const scheduleTestDrive = async ({
    carId,
    date
}: {
    carId: string,
    date: Date,
}) => {
    const session = await auth()

    const Authuser = session?.user

    if (!Authuser) throw Error("User not Authenticated")

    const user = await prisma.user.findUnique({
        where: {
            email: Authuser.email
        },

        select: {
            id: true
        }
    })


    if (!user) throw Error("User not Found")

    const car = await prisma.car.findUnique({
        where: {
            id: carId,
        },
        select: {
            id: true
        }

    })
    if (!car) throw Error("Car not Found")

    await prisma.testDriveRequest.upsert({
        where: {
            carId_userId: {
                carId: carId,
                userId: user.id,
            },
        },
        create: { carId, userId: user.id, date },
        update: { date }
    });

    revalidatePath(`/cars/${carId}`)
    return {success:true}

}


export const bookmarkCar =async(carId:string)=>{


     const session = await auth()

    const Authuser = session?.user

    if (!Authuser) throw Error("User not Authenticated")

    const user = await prisma.user.findUnique({
        where: {
            email: Authuser.email
        },

        select: {
            id: true
        }
    })


    if (!user) throw Error("User not Found")
    if (!carId) throw Error("carId not Found")

    const car = await prisma.car.findUnique({
        where: {
            id: carId,
        },
        select: {
            id: true,
            savedBy:{
                select:{
                    id:true,
                }
            }
        }

    })
    if (!car) throw Error("Car not Found")
        

    const isAlreadySaved=car.savedBy.some((item)=>item.id ===user.id)    

    if (isAlreadySaved){
        await prisma.car.update({
            where:{
                id:carId
            },
            data:{
                savedBy:{
                    disconnect:{
                        id:user.id
                    }
                }
            }
        })
    }

    else{
        await prisma.car.update({
            where:{
                id:carId
            },
            data:{
                savedBy:{
                    connect:{
                        id:user.id
                    }
                }
            }
        })
    }

       revalidatePath(`/cars/${carId}`)
}

export  const ContactSellerAction=async({carId,firstName="",lastName="",content="",email="",phone=""}:ContactSellerSchema)=>{

     const session = await auth()

    const Authuser = session?.user

    if (!Authuser) throw Error("User not Authenticated")

    const user = await prisma.user.findUnique({
        where: {
            email: Authuser.email
        },

        select: {
            id: true
        }
    })


    if (!user) throw Error("User not Found")
    if (!carId) throw Error("Car Id not Found")


    const car = await prisma.car.findUnique({
        where: {
            id: carId,
        },
        select: {
            id: true
        }

    })
    if (!car) throw Error("Car not Found")

        await prisma.message.create({
            data:{
            firstName,lastName,content,email,phone,
                userId:user.id
            }
        })

} 