const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const projectController = require('../controllers/projectController');

// @route   GET api/projects
// @desc    Récupérer tous les projets de l'utilisateur
// @access  Privé
router.get('/', projectController.getProjects);

// @route   GET api/projects/:id
// @desc    Récupérer un projet spécifique
// @access  Privé
router.get('/:id', projectController.getProjectById);

// @route   POST api/projects
// @desc    Créer un nouveau projet
// @access  Privé
router.post('/', projectController.createProject);

// @route   PUT api/projects/:id
// @desc    Mettre à jour un projet
// @access  Privé
router.put('/:id', projectController.updateProject);

// @route   DELETE api/projects/:id
// @desc    Supprimer un projet
// @access  Privé
router.delete('/:id', projectController.deleteProject);

// @route   GET api/projects/:id/results
// @desc    Récupérer les résultats d'un projet
// @access  Privé
router.get('/:id/results', projectController.getProjectResults);

// @route   POST api/projects/:id/results
// @desc    Ajouter des résultats à un projet
// @access  Privé
router.post('/:id/results', projectController.addProjectResults);

module.exports = router; 