import React, { useEffect, useState } from 'react'

function UserList() {
    const [users,setUsers]=useState([]);
    const [loading,setLoading]=useState(true);
    const [error,setError]=useState(null);

    const fetchUsers=async()=>{
        try{
            const res=await fetch('http://localhost:5000/api/users');
            if(!res.ok) throw new Error('Failed to fetch users')
                const data = await res.json()
            setUsers(data);
            setLoading(false);
        }catch(err){
            setError(err.message)
            setLoading(false)
        }
    }
    useEffect(()=>{
        fetchUsers();
    },[]);
    if (loading) return <p>Loading users...</p>
    if (error) return <p>Error: {error}</p>
  return (
    <ul>
        {
            users.map((user)=>(
                <li key={user._id}>
                    {user.name}--{user.email}
                </li>
            ))
        }
    </ul>
  )
}

export default UserList