const Project = require('../models/Project');

// Récupérer tous les projets d'un utilisateur
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
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
      return res.status(404).json({ message: 'Projet non trouvé' });
    }

    res.json(project);
  } catch (error) {
    console.error('Erreur lors de la récupération du projet:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Projet non trouvé' });
    }
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Créer un nouveau projet
exports.createProject = async (req, res) => {
  const { name, description, status, targetAudience, budget, startDate, endDate } = req.body;

  try {
    const newProject = new Project({
      name,
      description,
      status,
      targetAudience,
      budget,
      startDate,
      endDate,
      user: req.user.id
    });

    const project = await newProject.save();
    res.json(project);
  } catch (error) {
    console.error('Erreur lors de la création du projet:', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
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
      return res.status(404).json({ message: 'Projet non trouvé' });
    }

    // Mettre à jour le projet
    project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: projectFields },
      { new: true }
    );

    res.json(project);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du projet:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Projet non trouvé' });
    }
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer un projet
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findOne({ 
      _id: req.params.id,
      user: req.user.id
    });

    if (!project) {
      return res.status(404).json({ message: 'Projet non trouvé' });
    }

    await Project.findByIdAndRemove(req.params.id);
    res.json({ message: 'Projet supprimé' });
  } catch (error) {
    console.error('Erreur lors de la suppression du projet:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Projet non trouvé' });
    }
    res.status(500).json({ message: 'Erreur serveur' });
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
      return res.status(404).json({ message: 'Projet non trouvé' });
    }

    res.json(project.results || []);
  } catch (error) {
    console.error('Erreur lors de la récupération des résultats du projet:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Projet non trouvé' });
    }
    res.status(500).json({ message: 'Erreur serveur' });
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
      return res.status(404).json({ message: 'Projet non trouvé' });
    }

    // Mettre à jour le projet avec les nouveaux résultats
    project = await Project.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          results: results,
          status: 'Terminé',
          country: country || project.country,
          categories: categories || project.categories,
          updatedAt: Date.now()
        }
      },
      { new: true }
    );

    res.json(project);
  } catch (error) {
    console.error('Erreur lors de l\'ajout des résultats au projet:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Projet non trouvé' });
    }
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
