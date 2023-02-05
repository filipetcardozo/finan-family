/* eslint-disable react-hooks/exhaustive-deps */

import {
    onAuthStateChanged, signInWithEmailAndPassword, User, signOut as callSignOut,
    getAuth, createUserWithEmailAndPassword
} from "firebase/auth";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { firebaseApp } from "../../../firebaseConfig";
import { useRouter } from 'next/router'

interface Auth {
    isLogged: boolean | undefined;
    loading: boolean;
    uid: string;
    error?: string;
    user?: User;
    signIn(value: SignInType): void;
    signUp(email: string, password: string): Promise<any>;
    signOut(): void;
}

export interface SignInType {
    email: string;
    password: string;
}

type Props = {
    children?: React.ReactNode;
};

const AuthContext = createContext<Auth>({} as Auth)

export const AuthProvider: React.FC<Props> = ({ children }) => {
    const [isLogged, setIsLogged] = useState<boolean | undefined>()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [uid, setUid] = useState("")
    const [user, setUser] = useState<User>()
    const router = useRouter()

    const auth = getAuth(firebaseApp);

    function signIn(credentials: SignInType) {
        setLoading(true)

        signInWithEmailAndPassword(auth, credentials.email, credentials.password)
            .then(() => {
                router.push("/")
            })
            .catch((err) => {
                console.log("Error in loggin: ", err)
            })
            .finally(() => {
                setLoading(false)
                console.log("Logged")
            })
    }

    async function signUp(email: string, password: string) {
        return createUserWithEmailAndPassword(auth, email, password)
            .then(() => {

            })
    }

    function signOut() {
        callSignOut(auth)
            .then(() => {
                setIsLogged(false)
                router.push("/auth/login")
            })
            .catch((error) => {
                console.log(error)
            });
    }

    function checkOnAuthStateUser(user: User | null) {
        if (user) {
            setUid(user.uid)
            setIsLogged(true)
        } else {
            setUser(undefined)
            setIsLogged(false)
        }

        setLoading(false)
    }

    const userProvider = useMemo((): Auth => ({
        isLogged,
        loading,
        error,
        user,
        uid,
        signIn,
        signOut,
        signUp,
    }), [isLogged, loading, error, uid, user])

    useEffect(() => {
        setLoading(true)
        const subscribe = onAuthStateChanged(auth, checkOnAuthStateUser)
        return subscribe;
    }, [])

    return (
        <AuthContext.Provider value={userProvider}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = (): Auth => {
    const context = useContext(AuthContext)

    return context;
}

export const useProtectPage = () => {
    const { isLogged } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (isLogged === false) {
            router.push('/login')
        }
    }, [isLogged])
}