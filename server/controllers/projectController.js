const Project = require('../models/Project');

// Récupérer tous les projets d'un utilisateur
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    console.error('Error retrieving projects:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Récupérer un projet spécifique
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findOne({ 
      _id: req.params.id,
      user: req.user.id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error retrieving project:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Fonction pour créer un nouveau projet
exports.createProject = async (req, res) => {
  try {
    const { name } = req.body;
    
    // Vérifier que le nom du projet est fourni
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required'
      });
    }
    
    // Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Créer le projet avec les données fournies
    const projectData = {
      ...req.body,
      status: req.body.status || 'In Progress',
      user: req.user.id
    };

    const project = new Project(projectData);
    await project.save();
    
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
};

// Mettre à jour un projet
exports.updateProject = async (req, res) => {
  const { name, description, status, targetAudience, budget, startDate, endDate } = req.body;

  // Construire l'objet de mise à jour
  const projectFields = {};
  if (name) projectFields.name = name;
  if (description) projectFields.description = description;
  if (status) projectFields.status = status;
  if (targetAudience) projectFields.targetAudience = targetAudience;
  if (budget) projectFields.budget = budget;
  if (startDate) projectFields.startDate = startDate;
  if (endDate) projectFields.endDate = endDate;
  projectFields.updatedAt = Date.now();

  try {
    let project = await Project.findOne({ 
      _id: req.params.id,
      user: req.user.id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Mettre à jour le projet
    project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: projectFields },
      { new: true }
    );

    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Supprimer un projet
exports.deleteProject = async (req, res) => {
  try {
    console.log('Attempting to delete project:', req.params.id);
    console.log('Authenticated user:', req.user.id);
    
    // Vérifier si l'ID du projet est valide
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid project ID:', req.params.id);
      return res.status(400).json({ message: 'Invalid project ID' });
    }
    
    // Vérifier d'abord si le projet existe
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      console.log('Project not found');
      return res.status(404).json({ message: 'Project not found' });
    }
    
    console.log('Project found:', project);
    console.log('Project owner:', project.user);
    
    // Convertir les IDs en chaînes pour une comparaison fiable
    const projectUserId = project.user.toString();
    const requestUserId = req.user.id.toString();
    
    console.log('Comparing IDs:', { projectUserId, requestUserId });
    
    // Vérifier si l'utilisateur est autorisé à supprimer ce projet
    if (projectUserId !== requestUserId) {
      console.log('User not authorized to delete this project');
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }

    try {
      // Supprimer le projet
      await Project.findByIdAndDelete(req.params.id);
      console.log('Project deleted successfully');
      
      res.json({ message: 'Project deleted' });
    } catch (deleteError) {
      console.error('Specific error during deletion:', deleteError);
      return res.status(500).json({ message: 'Error deleting project' });
    }
  } catch (error) {
    console.error('Error deleting project:', error);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found - Invalid ID' });
    }
    res.status(500).json({ message: 'Server error during deletion' });
  }
};

// Récupérer les résultats d'un projet
exports.getProjectResults = async (req, res) => {
  try {
    const project = await Project.findOne({ 
      _id: req.params.id,
      user: req.user.id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project.results || []);
  } catch (error) {
    console.error('Error retrieving project results:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Ajouter des résultats à un projet
exports.addProjectResults = async (req, res) => {
  try {
    const { results, country, categories } = req.body;
    
    let project = await Project.findOne({ 
      _id: req.params.id,
      user: req.user.id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Mettre à jour le projet avec les nouveaux résultats
    project = await Project.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          results: results,
          status: 'Completed',
          country: country || project.country,
          categories: categories || project.categories,
          updatedAt: Date.now()
        }
      },
      { new: true }
    );

    res.json(project);
  } catch (error) {
    console.error('Error adding project results:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};
