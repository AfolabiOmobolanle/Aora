import { Client, Account,ID, Avatars, Databases, Query,Storage } from 'react-native-appwrite';
export const config ={
    endpoint: 'https://cloud.appwrite.io/v1',
    platform: 'com.jsm.aora',
    projectId: '6620f11955432afec2cc',
    databaseId: '6620fb629c5d8d34d805',
    userCollectionId: '6620fbf0b0b395ab20c5',
    videoCollectionId: '6620fc101093c6608301',
    storageId: '6620fed8762b1b8c183b',
}

const {
        endpoint,
platform,
projectId,
databaseId,
userCollectionId,
videoCollectionId,
storageId,
} = config;

// Init your react-native SDK
const client = new Client();

client
    .setEndpoint(endpoint) 
    .setProject(projectId) 
    .setPlatform(platform) 
;

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);
const storage = new Storage(client);


export const createUser = async (email, password,username) =>{
console.log("reg password",password);
     try {
       const newAccount = await account.create(
        ID.unique(),
        email,
        password,
        username
       ) 

       if (!newAccount) throw Error;

       const avatarUrl = avatars.getInitials(username)

       await signIn(email, password);

       const newUser = await databases.createDocument(
        databaseId,
        userCollectionId,
        ID.unique(),{
            accountId: newAccount.$id,
            email,
            username,
            avatar: avatarUrl
        }
       )
     } catch (error) {
     throw new Error(error);   
     }
}

export const signIn = async (email,password)=>{
    try {
        const session = await account.createEmailSession(email,password)

        return session;
    } catch (error) {
     console.log(error);
     throw new Error(error);   
     }
}


export const  getCurrentUser = async () =>{
    try {
    const currentAccount = await account.get();
    
    if (!currentAccount) throw Error;

    const currentuser = await databases.listDocuments(
        databaseId,
        userCollectionId,
        [Query.equal('accountId', currentAccount.$id)]
    )

    if (!currentuser) throw Error;

    return currentuser.documents[0];
        
    
    } catch (error) {
        console.log(error)
    }
}

export const getAllPosts = async ()=>{
    try {
        const posts = await databases.listDocuments(
            databaseId,
            videoCollectionId
        )
        return posts.documents
    } catch (error) {
        throw new Error(error)
    }
}

export const getLatestVideos = async ()=>{
    try {
        const posts = await databases.listDocuments(
            databaseId,
            videoCollectionId,
            [Query.orderDesc('$createdAt',Query.limit(7))]
        )
        return posts.documents
    } catch (error) {
        throw new Error(error)
    }
}

export const searchPosts = async (query)=>{
    try {
        const posts = await databases.listDocuments(
            databaseId,
            videoCollectionId,
            [Query.search('title', query)]
        )
        return posts.documents
    } catch (error) {
        throw new Error(error)
    }
}


export const getUserPosts = async (userId)=>{
    try {
        const posts = await databases.listDocuments(
            databaseId,
            videoCollectionId,
            [Query.equal('creator', userId)]
        )
        return posts.documents
    } catch (error) {
        throw new Error(error)
    }
}

export const signOut = async()=>{
    try {
        const session = await account.deleteSession('current');

        return session;
        
    } catch (error) {
        throw new Error(error)
        
    }
}

export const getFilePreview = async(fileId, type) =>{
let fileUrl;

try {
    if(!type ==='video'){
fileUrl=storage.getFileView(storageId,fileId)
    } else if(type === 'image' ){
fileUrl = storage.getFilePreview(storageId,fileId,
2000, 2000, 'top',100)
    }
    else {
throw new Error("invalid file type")

}
if (!fileUrl) throw Error;
    
return fileUrl;
}
  catch (error) {
             
throw new Error(error)

    }
}

export const uploadFile = async (file,type)=>{
if (!file) return 
    const asset = {
        name:file.fileName,
        type: file.mimeType,
        size: file.fileSize,
        uri: file.uri,  };
    try {
        const uploadedFile = await storage.createFile(storageId,ID.unique(),asset)
        const fileUrl = await getFilePreview(uploadedFile.$id,type);

        return fileUrl;
    } catch (error) {
              throw new Error(error)

    }

}
export const createVideo = async(form)=>{
try {
    const [thumbnailUrl, videoUrl] = await Promise.all([
        uploadFile(form.thumbnail, 'image'),
        uploadFile(form.thumbnail, 'video'),

    ])
    const newPost = await databases.createDocument(
        databaseId,videoCollectionId,ID.unique(),
        {
        title: form.title,
        thumbnail: thumbnailUrl,
        video:videoUrl,
        prompt: form.prompt,
        creator: form.userId

    }

    )

    return newPost;
    
} catch (error) {
    
}


}