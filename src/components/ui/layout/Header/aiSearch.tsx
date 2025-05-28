"use client";

import React, { FormEvent, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../dialog'
import { SearchIcon, SmileIcon } from 'lucide-react'
import { useRouter } from 'next/navigation';
import { Textarea } from "../../textarea";
import { Button } from "../../button";
import { toast } from "sonner";
import { findCaByAI } from "@/lib/actions/ai.actions";
import { string } from "zod";



const AiSearch = () => {

  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");

  const router = useRouter();

  const submitHandler = async (e: FormEvent<HTMLFormElement>) => {

    e.preventDefault()

    if (!description)
      return toast.error("please enter the description")
    setIsLoading(true)

    try {

      const result: "no car found" | "error getting car search" | string = await findCaByAI(description)

      console.log('result',result);
      

      const carId = string().parse(result);

      router.replace(`/cars/${carId}`)

      toast.success(`Car found with id ${carId}`)
      setDescription("")
      setIsOpen(false)

    } catch (error) {

      if (error instanceof Error) toast.error(error.message)
    else toast.error("An unexpected error occured")
    }

    finally {
      setIsLoading(false)
    }

  }

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger className="ml-auto mr-4  flex items-center gap-1  bg-muted rounded-lg px-4 py-2 hover:bg-muted">
        <SearchIcon className="h-4 w-4" /> Search with AI
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Define what type of car you like </DialogTitle>
          <DialogDescription>
            You can tell features like color, type, and model. For example: I
            like a red SUV with a sunroof.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={submitHandler}>
          <Textarea
            placeholder="Write About your dream car.."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="max-h-[20rem"
            rows={5}
            style={{
              // @ts-expect-error: third-party type mismatch
              fieldSizing: "content"
            }}
          />

          <Button disabled={isLoading} className="flex items-center gap-1">
            {isLoading ? "Searching..." : <>

              <SmileIcon className="h-5 w-5" /> Find My Dream Car
            </>}
          </Button>




        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AiSearch