'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Input } from '../../input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../select';
import { Button } from '../../button';
import { Search } from 'lucide-react';

type MySearchProps = {
  searchParams: {
    modelname?: string;
    price?: string;
    type?: string;
    page?: string;
  };
};

const MySearch: React.FC<MySearchProps> = ({ searchParams }) => {
  const router = useRouter();

  const [modelname, setModelname] = useState(searchParams.modelname || '');
  const [price, setPrice] = useState(searchParams.price || '');


   useEffect(() => {
    const currentParams = new URLSearchParams(window.location.search);
    if (!currentParams.has('type')) {
      currentParams.set('type', '');
      router.replace(`?${currentParams.toString()}`);
    }
  }, []);

  const handleSearch = () => {
    const query: Record<string, string> = {};

    if (modelname) query.modelname = modelname;
    if (price) query.price = price;

    const queryString = new URLSearchParams(query).toString();

    console.log('queryString',queryString);
    
    router.push(`/?${queryString}`);
  };



  useEffect(() => {
  const timeoutId = setTimeout(() => {
    const currentParams = new URLSearchParams(window.location.search);

    if (modelname) {
      currentParams.set('modelname', modelname);
    } else {
      currentParams.delete('modelname');
    }

    if (price) {
      currentParams.set('price', price);
    } else {
      currentParams.delete('price');
    }

    router.push(`?${currentParams.toString()}`);
    
  }, 300); // debounce timeout

  return () => {
    clearTimeout(timeoutId);
  };
}, [modelname, price, router]);


  return (
    <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 max-w-4xl mx-auto shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input
          placeholder="search by make,model..."
          className="md:col-span-2"
          value={modelname}
          onChange={(e) => setModelname(e.target.value)}
        />
        <Select value={price} onValueChange={setPrice}>
          <SelectTrigger>
            <SelectValue placeholder="Price range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0-10000">$0 - $10,000</SelectItem>
            <SelectItem value="10000-20000">$10,000 - $20,000</SelectItem>
            <SelectItem value="20000-30000">$20,000 - $30,000</SelectItem>
            <SelectItem value="30000+">$30,000+</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} className="w-full">
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      </div>
    </div>
  );
};

export default MySearch;
