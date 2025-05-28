import "server-only"

import { google } from "@ai-sdk/google"
import { generateText, LanguageModelV1, zodSchema } from "ai"
import { GEMINI_FLASH } from "@/constants/config"
import { addCarSchema } from "../zod"
import { generateCarPrompt, searchCarPrompt } from "./prompt"
import { getAllCarsForAi } from "./cars.action"



class AiService {
    private model: LanguageModelV1;
    private searchModel: LanguageModelV1;

    constructor() {
        this.model = google(GEMINI_FLASH);

        this.searchModel = google(GEMINI_FLASH, {
            useSearchGrounding: true,
        });
    }

    generateCarAgents = async (carName: string) => {
        const modifiedSchema = zodSchema(addCarSchema).jsonSchema

        const { text } = await generateText({
            model: this.searchModel,
            messages: [
                {
                    role: "assistant",
                    content: generateCarPrompt
                },
                {
                    role: "assistant",
                    content: "The car zod schema is: " + JSON.stringify(modifiedSchema)
                },
                {
                    role: "user",
                    content: `The car name: ${carName}}`
                },
            ]
        })

        return text
    };


    searchAgent = async (carDescription: string) => {
        const cars = await getAllCarsForAi();

        const carlist = cars.map((item) => ({
            id: item.id,
            name: item.name,
            year: item.year,
            mileage: item.mileage,
            price: item.price,
            image: item.images[0],
            description: item.description,
            brand: item.brand,
            fuel: item.fuelType,
            transmission: item.transmission,
            availbleColors: item.colors,
            location: item.location,
            features: item.features,
            cartype: item.type,
        }));


        const { text } = await generateText({

            model: this.searchModel,
            messages: [
                {
                    role: "assistant",
                    content: searchCarPrompt,
                },
                {
                    role: "assistant",
                    content: "The car list is: " + JSON.stringify(carlist)
                },
                {
                    role: "user",
                    content: carDescription
                },
            ]

        })

        return text
    }
}


export const aiService = new AiService()