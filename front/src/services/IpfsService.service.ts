import {ChangeEvent} from "react";

/**
 * Choix de la photo
 * @param event
 * @param setFile
 * @param setPicture
 */
export function selectedPhotoToken(event: ChangeEvent<HTMLInputElement>, setFile: Function, setPicture: Function) {
    const filesUploaded = event.currentTarget.files;
    if (filesUploaded && filesUploaded.length > 0) {
        setPictureBase64(filesUploaded[0], setFile, setPicture);
    }
};

/**
 * Set l'url de la photo
 * @param file
 * @param setFile
 * @param setPicture
 */
const setPictureBase64 = (file: any, setFile: Function, setPicture: Function) => {
    setFile(file);
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
        setPicture(reader.result as string);
    };
    reader.onerror = function (error) {
        console.log('Error: ', error);
    };
};

/**
 * création d'un fichier a partir d'une url base 64
 * @param src
 * @param name
 */
export async function dataUrlToFile(src: string, name: string){
    return (fetch(src)
        .then(function (res) {
            return res.arrayBuffer();
        }))
        .then(function (buf) {
            return new File([buf], name, {type: 'image/*'});
        })
};
