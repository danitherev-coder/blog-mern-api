const { request, response } = require("express")
const Post = require("../models/Post")
const cloudinary = require('cloudinary').v2;


// const posts = async (req, res) => {
//     const page = req.query.page || 1;
//     const pageSize = req.query.pageSize || 5;

//     const query = req.query.cat
//         ? { cat: req.query.cat }
//         : {};

//     const options = {
//         skip: parseInt((page - 1) * pageSize),
//         limit: parseInt(pageSize),
//         sort: { createdAt: 'desc' },
//     };

//     try {
//         const posts = await Post.find(query, null, options).populate('autor');
//         return res.status(200).json(posts);
//     } catch (err) {
//         return res.status(500).send(err);
//     }
// };

const posts = async (req, res) => {
    const page = req.query.page || 1;
    const pageSize = req.query.pageSize || 5;

    const query = req.query.cat ? { cat: req.query.cat } : {};

    const search = req.query.search;

    if (search) {
        query.titulo = { $regex: search, $options: "i" };
    }

    const options = {
        skip: parseInt((page - 1) * pageSize),
        limit: parseInt(pageSize),
        sort: { createdAt: 'desc' }
    };

    try {
        const posts = await Post.find(query, null, options).populate('autor');
        return res.status(200).json(posts);
    } catch (err) {
        return res.status(500).send(err);
    }
};



const obtenerPostxCreador = async (req = request, res = response) => {
    const id = req.usuario.id
    const post = await Post.find({ autor: id }).sort({ createdAt: 'desc' }).populate('autor')
    console.log(post, ' post pertenece al usuario');

    return res.status(200).json(post)
}


const post = async (req = request, res = response) => {
    const { id } = req.params
    const post = await Post.findById(id).populate('autor')
    res.json(post)
}

const createPost = async (req = request, res = response) => {
    const { titulo, desc, img, cat } = req.body

    // Agrega la validación para verificar el valor del campo img
    if (!img) {
        return res.status(400).json({ msg: "Debe proporcionar una imagen para el post." });
    }

    const { id } = req.usuario
    const post = new Post({
        titulo,
        desc,
        img,
        cat,
        autor: id
    })
    await post.save()
    res.json(post)
}

const editPost = async (req = request, res = response) => {
    const { id } = req.params
    const { titulo, desc, img, cat } = req.body

    // si la imagen no viene en el body, etonces se mantiene la misma
    const postImg = await Post.findById(id);
    if (!img) {
        let img = postImg.img;
        return img
    }
    // si el usuario que inicio sesion no es el autor, entonces no puede editar el post
    if (postImg.autor.toString() !== req.usuario.id) {
        return res.status(401).json({
            msg: 'Usted no es el autor del post, por lo cual no puede editar esta entrada'
        })
    }
    const post = await Post.findByIdAndUpdate(id, {
        titulo,
        desc,
        img,
        cat
    }, { new: true })
    res.json(post)
}


// obtener la imagen de cloudinary
const deleteImg = (imagePublicId) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(imagePublicId, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve({ result, msg: 'Imagen eliminada' });
            }
        });
    });
};

const deletePost = async (req, res) => {
    const { id } = req.params;

    // Obtener el post
    const post = await Post.findById(id);

    // Verificar que el usuario que quiere eliminar el post es el mismo que lo creó
    if (post.autor.toString() !== req.usuario.id) {
        return res.status(401).json({
            msg: 'No tienes permiso para eliminar este post'
        });
    }

    // Si el post tiene una imagen asociada, eliminarla de Cloudinary
    if (post.img) {
        // obtener la url de la imagen para eliminar el public_id
        const imagePublicId = post.img
        console.log(imagePublicId);
        try {
            await deleteImg(imagePublicId);
        } catch (error) {
            return res.status(500).json({
                msg: 'Error al eliminar la imagen del post'
            });
        }
    }

    // Eliminar el post
    await post.remove();

    res.json({
        msg: 'Post eliminado'
    });
};



module.exports = {
    obtenerPostxCreador,
    posts,
    post,
    createPost,
    editPost,
    deletePost
};
