
import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import SplashScreen from './SplashScreen';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Home, BookOpen, Users, Mail, MessageCircle, Star, Eye, Info, Phone, Sun, Moon, Search, Trash2, Reply, Send } from 'lucide-react';
import notesData from './notes/notesData';
// Semester to subjects mapping
const semesterSubjects = {
  3: [
    "Syllabus",
    "Data Science",
    "Data Structures",
    "Principles of Artificial Intelligence",
    "Probability, Statistics and Linear Algebra",
    "Digital Logic Design",
    "Universal Human Values",
    "Critical Reasoning, System Thinking"
  ],
  4: [
    "Machine Learning",
    "Object-Oriented Programming",
    "Computational Mathematics",
    "Computer Networks and Internet Protocols",
    "Software Engineering",
    "Database Management System"
  ],
  5: [
    "Syllabus",
    "Computer Architecture and Organization",
    "Design and Analysis of Algorithms",
    "Data Mining",
    "Internet of Things",
    "Operating System",
    "Principles of Entrepreneurship Mindset"
  ],
  6: [
    "Digital Image Processing",
    "Fundamentals of Deep Learning",
    "Big Data Analytics",
    "Cognitive Computing",
    "Blockchain Technology",
    "Cloud Computing"
  ]
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const KaMaTi = () => {
  const [activeSection, setActiveSection] = useState('home');
  // Flatten notesData into a single array for easier filtering
  const allNotes = Object.entries(notesData).flatMap(([subject, notes]) =>
    notes.map((note, idx) => ({
      id: `${subject}-${idx}`,
      title: note.title,
      semester: note.semester,
      subject,
      size: note.size || '2 MB',
      file_url: note.url,
      uploaded_at: note.uploaded_at || '',
    }))
  );
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3500); // Show splash for 3.5s
    return () => clearTimeout(timer);
  }, []);

  const [notes, setNotes] = useState(allNotes);
  const [discussions, setDiscussions] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 5, comment: '', name: '' });
  const [newDiscussion, setNewDiscussion] = useState({ title: '', content: '' });
  // Default: show all subjects and semester 3
  const [filters, setFilters] = useState({ year: '', subject: 'all', semester: '3' });
  const [theme, setTheme] = useState('dark'); // 'light' or 'dark'
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [newReply, setNewReply] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Sample notes data - will be replaced with real database data
  const sampleNotes = [
    {
      id: '1',
      title: 'Linear Regression Notes',
      semester: '3',
      subject: 'Data Science',
      size: '2.1 MB',
      file_url: '#',
      uploaded_at: '2024-12-01'
    },
    {
      id: '2', 
      title: 'FODS Assignment Solutions',
      semester: '3',
      subject: 'Data Science',
      size: '1.8 MB',
      file_url: '#',
      uploaded_at: '2024-11-28'
    },
    {
      id: '3',
      title: 'Machine Learning Basics', 
      semester: '3',
      subject: 'Data Science',
      size: '3.2 MB',
      file_url: '#',
      uploaded_at: '2024-11-25'
    },
    {
      id: '4',
      title: 'Python Programming Guide',
      semester: '3', 
      subject: 'Computer Science',
      size: '2.5 MB',
      file_url: '#',
      uploaded_at: '2024-11-20'
    },
    {
      id: '5',
      title: 'Database Management System',
      semester: '4',
      subject: 'Computer Science', 
      size: '4.1 MB',
      file_url: '#',
      uploaded_at: '2024-11-15'
    },
    {
      id: '6',
      title: 'Web Development Fundamentals',
      semester: '4',
      subject: 'Computer Science',
      size: '3.8 MB', 
      file_url: '#',
      uploaded_at: '2024-11-10'
    }
  ];


  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    // Show feedback popup after 5 minutes, only if not already filled
    if (!localStorage.getItem('feedbackSubmitted')) {
      const timer = setTimeout(() => {
        setShowFeedback(true);
      }, 300000); // 5 minutes
      return () => clearTimeout(timer);
    }
    // Load discussions only (notes are static from notesData)
    loadDiscussions();
    setNotes(allNotes);
  }, [theme]);

  const loadDiscussions = async () => {
    try {
      const response = await axios.get(`${API}/discussions`);
      setDiscussions(response.data);
    } catch (error) {
      console.error('Error loading discussions:', error);
    }
  };

  // Remove loadNotes, not needed anymore

  const submitFeedback = async () => {
    try {
      await axios.post(`${API}/feedback`, feedback);
      setShowFeedback(false);
      localStorage.setItem('feedbackSubmitted', 'true');
      // Open WhatsApp channel
      window.open('https://whatsapp.com/channel/0029Vb6RPBA1NCrTsBR2FD1U', '_blank');
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const createDiscussion = async () => {
    if (!newDiscussion.title.trim() || !newDiscussion.content.trim()) return;
    
    try {
      await axios.post(`${API}/discussions`, newDiscussion);
      setNewDiscussion({ title: '', content: '' });
      loadDiscussions();
    } catch (error) {
      console.error('Error creating discussion:', error);
    }
  };

  const createReply = async (discussionId) => {
    if (!newReply.trim()) return;
    
    try {
      await axios.post(`${API}/discussions/${discussionId}/replies`, {
        content: newReply,
        author: 'Anonymous'
      });
      setNewReply('');
      setReplyingTo(null);
      loadDiscussions();
    } catch (error) {
      console.error('Error creating reply:', error);
    }
  };

  const deleteDiscussion = async (discussionId) => {
    try {
      await axios.delete(`${API}/discussions/${discussionId}`);
      loadDiscussions();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting discussion:', error);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const NavigationItem = ({ icon: Icon, label, section, onClick }) => (
    <div
      className={`nav-item ${activeSection === section ? 'active' : ''}`}
      onClick={onClick || (() => setActiveSection(section))}
      title={label}
    >
      <Icon size={24} />
      {/* Only icon, no text */}
    </div>
  );

  // Fix filtering logic for new notesData structure
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSemester = filters.semester === 'all' || note.semester === filters.semester;
    const matchesSubject = filters.subject === 'all' || note.subject === filters.subject;
    return matchesSearch && matchesSemester && matchesSubject;
  });

  return (
    <div className={`kamati-container ${theme}`}>
      {/* Top Header with Logo and Theme Toggle */}
      <div className="top-header">
        <div className="logo-header">
          <img 
            src="https://customer-assets.emergentagent.com/job_kamati-hub/artifacts/h1njd072_KaMaTi%20Gang%20of%20Study%20%282%29.png" 
            alt="KaMaTi Gang" 
            className="header-logo"
          />
          <span className="header-logo-text">KaMaTi Gang</span>
        </div>
        <Button 
          onClick={toggleTheme} 
          className="theme-toggle"
          size="sm"
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </Button>
      </div>

      {/* Fixed Sidebar */}
      <div className="fixed-sidebar">
        <div className="nav-items">
          <NavigationItem icon={Home} label="Home" section="home" />
          <NavigationItem 
            icon={BookOpen} 
            label="Notes" 
            section="notes" 
            onClick={() => setShowNotesModal(true)}
          />
          <NavigationItem icon={Users} label="Community" section="community" />
          <NavigationItem icon={Info} label="About" section="about" />
          <NavigationItem icon={Mail} label="Contact" section="contact" />
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {activeSection === 'home' && (
          <>
            <div className="hero-section">
              <div className="hero-background-text">KaMaTi</div>
              {/* Welcome Content - Center Aligned */}
              <div className="welcome-content">
                <h1 className="hero-title">Welcome to KaMaTi Gang</h1>
                <p className="hero-subtitle">IPU Notes Hub • Simplified Resources • Vibrant Community</p>
                <div className="hero-buttons">
                  <Button 
                    className="cta-button primary"
                    onClick={() => setShowNotesModal(true)}
                  >
                    <BookOpen size={20} />
                    Explore Notes
                  </Button>
                  <Button 
                    className="cta-button secondary"
                    onClick={() => setActiveSection('community')}
                  >
                    <Users size={20} />
                    Join Community
                  </Button>
                </div>
              </div>
            </div>
            {/* Testimonials - Right Side (vertical column) */}
            <div className="hero-testimonials-right">
              <div className="testimonials-vertical">
                {[
                  { url: process.env.PUBLIC_URL + '/Screenshot 2025-09-01 002729.png', alt: 'Student feedback 1' },
                  { url: process.env.PUBLIC_URL + '/Screenshot 2025-09-01 003151.png', alt: 'Student feedback 2' },
                  { url: process.env.PUBLIC_URL + '/Screenshot 2025-09-01 003240.png', alt: 'Student feedback 3' },
                  { url: process.env.PUBLIC_URL + '/WhatsApp Image 2025-09-01 at 12.30.01 AM.jpeg', alt: 'Student feedback 4' }
                ].map((testimonial, index) => (
                  <div key={index} className="testimonial-card-vertical">
                    <img src={testimonial.url} alt={testimonial.alt} className="testimonial-screenshot-vertical" />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        {/* Glassmorphism Footer - Always at Bottom */}
        <footer className="glass-footer">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Developer Info</h4>
              <p>Akshat Pal</p>
              <p>React • Node.js • MongoDB</p>
              <p><a href="https://www.linkedin.com/in/akshatpal2007/" target="_blank" rel="noopener noreferrer">LinkedIn</a></p>
            </div>
            <div className="footer-section">
              <h4>Contact</h4>
              <p>kamatigangofstudy@gmail.com</p>
              <p><a href="https://whatsapp.com/channel/0029Vb6RPBA1NCrTsBR2FD1U" target="_blank" rel="noopener noreferrer">WhatsApp Channel</a></p>
            </div>
            <div className="footer-section">
			  <p>© 2025 KaMaTi Gang</p>
            </div>
          </div>
        </footer>
  )

        {activeSection === 'community' && (
          <div className="community-section">
            <div className="section-header">
              <h2>Community Discussion</h2>
              <p>Ask questions, share knowledge, help each other</p>
            </div>

            <div className="community-layout">
              <div className="recent-discussions">
                <h3>Recent Discussions</h3>
                <div className="discussions-list">
                  {discussions.length === 0 ? (
                    <div className="empty-discussions">
                      <p>No recent discussions</p>
                    </div>
                  ) : (
                    discussions.map((discussion) => (
                      <Card key={discussion.id} className="discussion-item">
                        <CardContent>
                          <div className="discussion-header">
                            <h4>{discussion.title}</h4>
                            <div className="discussion-actions">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setReplyingTo(replyingTo === discussion.id ? null : discussion.id)}
                                className="reply-btn"
                              >
                                <Reply size={14} />
                                Reply
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowDeleteConfirm(discussion.id)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                          <p>{discussion.content}</p>
                          <div className="discussion-meta">
                            <Badge variant="secondary">{discussion.replies || 0} replies</Badge>
                            <Badge variant="outline">{discussion.upvotes || 0} upvotes</Badge>
                          </div>

                          {/* Reply Form */}
                          {replyingTo === discussion.id && (
                            <div className="reply-form">
                              <Textarea
                                placeholder="Write your reply..."
                                value={newReply}
                                onChange={(e) => setNewReply(e.target.value)}
                                className="reply-textarea"
                                rows={3}
                              />
                              <div className="reply-actions">
                                <Button 
                                  size="sm" 
                                  onClick={() => createReply(discussion.id)}
                                  className="send-reply-btn"
                                >
                                  <Send size={14} />
                                  Send Reply
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setNewReply('');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              <div className="ask-question">
                <h3>Ask a Question</h3>
                <Card className="question-form-card">
                  <CardContent>
                    <div className="question-form">
                      <Input
                        placeholder="Question title..."
                        value={newDiscussion.title}
                        onChange={(e) => setNewDiscussion({...newDiscussion, title: e.target.value})}
                        className="question-input"
                      />
                      <Textarea
                        placeholder="Describe your question in detail..."
                        value={newDiscussion.content}
                        onChange={(e) => setNewDiscussion({...newDiscussion, content: e.target.value})}
                        className="question-textarea"
                        rows={6}
                      />
                      <Button onClick={createDiscussion} className="post-button">
                        <MessageCircle size={16} />
                        Post Question
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'about' && (
          <div className="about-section">
            <div className="section-header">
              <h2>About KaMaTi Gang</h2>
            </div>

            <div className="about-content">
              <div className="about-description">
                <p>
                  KaMaTi Gang is a dedicated study hub for IPU students, providing comprehensive notes, 
                  resources, and a vibrant community platform. We believe in making education accessible and 
                  fostering collaborative learning among students.
                </p>
                <p>
                  Join thousands of students who are already part of our community and accelerate your academic 
                  journey with our carefully curated resources and peer support.
                </p>
              </div>

              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">📚</div>
                  <h4>Quality Notes</h4>
                  <p>Curated study materials</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🛡️</div>
                  <h4>Community</h4>
                  <p>Connect with peers</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🚀</div>
                  <h4>Growth</h4>
                  <p>Accelerate learning</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'contact' && (
          <div className="contact-section">
            <div className="section-header">
              <h2>Reach Us</h2>
            </div>

            <div className="contact-content">
              <Card className="contact-card">
                <CardContent>
                  <div className="contact-item">
                    <Mail size={24} />
                    <div>
                      <p>kamatigangofstudy@gmail.com</p>
                    </div>
                  </div>
                  <div className="contact-item">
                    <MessageCircle size={24} />
                    <div>
                      <a 
                        href="https://whatsapp.com/channel/0029Vb6RPBA1NCrTsBR2FD1U" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="whatsapp-link"
                      >
                        WhatsApp Channel
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

    {/* Notes Modal - move above footer */}
    <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
      <DialogContent className="notes-modal">
        <DialogHeader>
          <DialogTitle>Study Materials</DialogTitle>
        </DialogHeader>
        {/* Search and Filters */}
        <div className="notes-controls">
          <div className="search-container">
            <Search size={18} />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="notes-filters">
            <Select value={filters.semester} onValueChange={(value) => setFilters({...filters, semester: value})}>
              <SelectTrigger>
                <SelectValue placeholder="All Semesters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                <SelectItem value="1">Semester 1</SelectItem>
                <SelectItem value="2">Semester 2</SelectItem>
                <SelectItem value="3">Semester 3</SelectItem>
                <SelectItem value="4">Semester 4</SelectItem>
                <SelectItem value="5">Semester 5</SelectItem>
                <SelectItem value="6">Semester 6</SelectItem>
                <SelectItem value="7">Semester 7</SelectItem>
                <SelectItem value="8">Semester 8</SelectItem>
              </SelectContent>
            </Select>
              <Select value={filters.subject} onValueChange={(value) => setFilters({...filters, subject: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {(semesterSubjects[filters.semester] || []).map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
        </div>
        <div className="notes-grid">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="note-card">
              <CardContent>
                <h4>{note.title}</h4>
                <div className="note-details">
                  <p><strong>Subject:</strong> {note.subject}</p>
                  <p><strong>Semester:</strong> {note.semester}</p>
                  <p><strong>Size:</strong> {note.size}</p>
                  <p><strong>Uploaded:</strong> {note.uploaded_at}</p>
                </div>
                <div className="note-actions">
                  <Button size="sm" className="view-button" asChild>
                    <a href={note.file_url} target="_blank" rel="noopener noreferrer">
                      <Eye size={16} />
                      View Note
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm !== null} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent className="delete-modal">
          <DialogHeader>
            <DialogTitle>Delete Discussion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this discussion? This action cannot be undone.</p>
          <div className="delete-actions">
            <Button 
              onClick={() => deleteDiscussion(showDeleteConfirm)} 
              className="delete-confirm-btn"
            >
              Delete
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(null)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Popup */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="feedback-modal">
          <DialogHeader>
            <DialogTitle>How much do you like our service?</DialogTitle>
          </DialogHeader>
          
          <div className="feedback-content">
            <div className="rating-section">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={32}
                  className={`star ${feedback.rating >= star ? 'filled' : ''}`}
                  onClick={() => setFeedback({...feedback, rating: star})}
                />
              ))}
            </div>
            
            <Input
              placeholder="Your name (optional)"
              value={feedback.name}
              onChange={(e) => setFeedback({...feedback, name: e.target.value})}
              className="feedback-name"
            />
            
            <Textarea
              placeholder="Any additional comments? (optional)"
              value={feedback.comment}
              onChange={(e) => setFeedback({...feedback, comment: e.target.value})}
              className="feedback-textarea"
            />
            
            <div className="feedback-actions">
              <Button onClick={submitFeedback} className="submit-feedback-button">
                Submit & Join WhatsApp
              </Button>
              <Button variant="outline" onClick={() => setShowFeedback(false)}>
                Maybe Later
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) return <SplashScreen />;

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<KaMaTi />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;