'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PlusIcon, TrashIcon, CheckIcon, CalendarIcon, ExclamationCircleIcon, TagIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import DatePicker, { registerLocale } from 'react-datepicker';
import tr from 'date-fns/locale/tr';
import "react-datepicker/dist/react-datepicker.css";

const DragDropContext = dynamic(
  () => import('@hello-pangea/dnd').then(mod => mod.DragDropContext),
  { ssr: false }
);

const Droppable = dynamic(
  () => import('@hello-pangea/dnd').then(mod => mod.Droppable),
  { ssr: false }
);

const Draggable = dynamic(
  () => import('@hello-pangea/dnd').then(mod => mod.Draggable),
  { ssr: false }
);

registerLocale('tr', tr);

interface Task {
  _id: string;
  content: string;
  priority: number;
  category: string;
  completed: boolean;
  followUp: boolean;
  dueDate: Date | null;
  tag: 'high' | 'medium' | 'low' | null;
  description: string;
}

interface Category {
  id: string;
  name: string;
}

const defaultCategories: Category[] = [
  { id: 'all', name: 'All' },
  { id: 'work', name: 'Work' },
  { id: 'study', name: 'Study' },
  { id: 'personal', name: 'Personal' },
  { id: 'shopping', name: 'Shopping' },
  { id: 'other', name: 'Other' }
];

const priorityTags = [
  { id: 'high', name: 'High Priority', color: 'bg-red-500' },
  { id: 'medium', name: 'Medium Priority', color: 'bg-yellow-500' },
  { id: 'low', name: 'Low Priority', color: 'bg-green-500' }
];

const generateTimeOptions = () => {
  const times = [];
  // From 07:00 to 23:30
  for (let i = 7; i < 24; i++) {
    times.push(new Date(0, 0, 0, i, 0));
    times.push(new Date(0, 0, 0, i, 30));
  }
  // From 00:00 to 06:30
  for (let i = 0; i < 7; i++) {
    times.push(new Date(0, 0, 0, i, 0));
    times.push(new Date(0, 0, 0, i, 30));
  }
  return times;
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [selectedNewTaskCategory, setSelectedNewTaskCategory] = useState('work');
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fadingTasks, setFadingTasks] = useState<string[]>([]);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState<'high' | 'medium' | 'low' | null>(null);
  const [showTagPicker, setShowTagPicker] = useState<string | null>(null);
  const [showDescription, setShowDescription] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState<string | null>(null);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const newTaskObj = {
      _id: Date.now().toString(),
      content: newTask.trim(),
      priority: tasks.length,
      category: selectedCategory === 'all' ? selectedNewTaskCategory : selectedCategory,
      completed: false,
      followUp: false,
      dueDate: null,
      tag: selectedTag,
      description: ''
    };

    setTasks([...tasks, newTaskObj]);
    setNewTask('');
    setSelectedNewTaskCategory('work');
    setSelectedTag(null);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    if (result.type === 'category') {
      const items = Array.from(categories);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      setCategories(items);
      return;
    }

    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setTasks(items.map((item, index) => ({ ...item, priority: index })));
  };

  const sortByTag = (tasks: Task[]) => {
    return [...tasks].sort((a, b) => {
      const tagOrder = { high: 3, medium: 2, null: 1, low: 0 };
      return (tagOrder[b.tag || 'null'] || 1) - (tagOrder[a.tag || 'null'] || 1);
    });
  };

  const filteredTasks = sortByTag(
    tasks.filter(task => 
      (selectedCategory === 'all' || task.category === selectedCategory) &&
      !task.completed &&
      !task.followUp
    )
  );

  const followUpTasks = sortByTag(
    tasks.filter(task => 
      (selectedCategory === 'all' || task.category === selectedCategory) &&
      !task.completed &&
      task.followUp
    )
  );

  const completedTasks = sortByTag(
    tasks.filter(task => task.completed)
  );

  const timeOptions = generateTimeOptions();

  const DatePickerComponent = ({ selected, onChange, onClose }: { 
    selected: Date | null, 
    onChange: (date: Date | null) => void, 
    onClose: () => void 
  }) => (
    <DatePicker
      selected={selected}
      onChange={onChange}
      locale="en"
      showTimeSelect
      timeFormat="HH:mm"
      timeIntervals={30}
      dateFormat="MMM d, yyyy HH:mm"
      inline
      includeTimes={timeOptions}
      onClickOutside={onClose}
    />
  );

  const handleTaskComplete = (taskId: string) => {
    setFadingTasks([...fadingTasks, taskId]);
    setTimeout(() => {
      setTasks(tasks.map(task =>
        task._id === taskId
          ? { ...task, completed: true }
          : task
      ));
      setFadingTasks(prev => prev.filter(id => id !== taskId));
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-[#efefef] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-center mb-8">
          <div className="relative w-[1000px] h-[300px]">
            <Image
              src="/logo/logo.png"
              alt="PrioPlan Logo"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm mb-8">
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-black focus:ring-black"
              />
              <div className="flex gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                  >
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                  </button>
                  {showDatePicker && (
                    <div className="absolute right-0 mt-2 z-10">
                      <DatePickerComponent
                        selected={null}
                        onChange={(date) => {
                          setTasks(tasks.map(t => ({ ...t, dueDate: date })));
                          setShowDatePicker(false);
                        }}
                        onClose={() => setShowDatePicker(false)}
                      />
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            {newTask.trim() && (
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex gap-2">
                  <div className="text-sm text-gray-500">Category:</div>
                  <div className="flex gap-2">
                    {categories.filter(c => c.id !== 'all').map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedNewTaskCategory(category.id)}
                        className={`px-2 py-1 text-xs rounded-full transition-colors ${
                          selectedNewTaskCategory === category.id
                            ? 'bg-black text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="text-sm text-gray-500">Priority:</div>
                  <div className="flex gap-2">
                    {priorityTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => setSelectedTag(tag.id as 'high' | 'medium' | 'low')}
                        className={`w-6 h-6 rounded-full transition-transform ${tag.color} ${
                          selectedTag === tag.id ? 'scale-125 ring-2 ring-offset-2 ring-black' : 'hover:scale-110'
                        }`}
                        title={tag.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="categories" direction="horizontal" type="category">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex gap-2 mb-4 overflow-x-auto pb-2"
              >
                {categories.map((category, index) => (
                  <Draggable key={category.id} draggableId={category.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-3 py-1.5 text-sm rounded-lg cursor-pointer transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-black text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {category.name}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <Droppable droppableId="tasks">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {filteredTasks.map((task, index) => (
                  <Draggable key={task._id} draggableId={task._id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between transition-all duration-[1000ms] ease-in-out ${
                          fadingTasks.includes(task._id) ? 'opacity-0 transform translate-x-full' : 'opacity-100 transform translate-x-0'
                        }`}
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleTaskComplete(task._id)}
                              className={`p-1 rounded-full transition-colors hover:bg-green-100 hover:text-green-600 ${
                                task.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                              }`}
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => setTasks(tasks.map(t => 
                                t._id === task._id ? { ...t, followUp: !t.followUp } : t
                              ))}
                              className={`p-1 rounded-full transition-colors hover:bg-yellow-100 hover:text-yellow-500 ${
                                task.followUp ? 'bg-yellow-100 text-yellow-500' : 'bg-gray-100 text-gray-400'
                              }`}
                            >
                              <ExclamationCircleIcon className="h-5 w-5" />
                            </button>
                            <div className="relative">
                              <button
                                onClick={() => setShowTagPicker(showTagPicker === task._id ? null : task._id)}
                                className="p-1 rounded-full transition-colors hover:bg-gray-100"
                              >
                                {task.tag ? (
                                  <div className={`w-5 h-5 rounded-full ${priorityTags.find(t => t.id === task.tag)?.color}`} />
                                ) : (
                                  <TagIcon className="h-5 w-5 text-gray-400" />
                                )}
                              </button>
                              {showTagPicker === task._id && (
                                <div className="absolute left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10">
                                  <div className="flex gap-2">
                                    {priorityTags.map((tag) => (
                                      <button
                                        key={tag.id}
                                        onClick={() => {
                                          setTasks(tasks.map(t => 
                                            t._id === task._id ? { ...t, tag: tag.id as 'high' | 'medium' | 'low' } : t
                                          ));
                                          setShowTagPicker(null);
                                        }}
                                        className={`w-6 h-6 rounded-full transition-transform ${tag.color} hover:scale-110 ${
                                          task.tag === tag.id ? 'ring-2 ring-offset-2 ring-black' : ''
                                        }`}
                                        title={tag.name}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="relative">
                              <button
                                onClick={() => setShowDescription(showDescription === task._id ? null : task._id)}
                                className="p-1 rounded-full transition-colors hover:bg-gray-100"
                              >
                                <InformationCircleIcon className={`h-5 w-5 ${task.description ? 'text-blue-500' : 'text-gray-400'}`} />
                              </button>
                              {showDescription === task._id && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setShowDescription(null)}
                                  />
                                  <div className="absolute left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-20 w-64">
                                    {editingDescription === task._id ? (
                                      <div className="space-y-2">
                                        <textarea
                                          value={task.description}
                                          onChange={(e) => setTasks(tasks.map(t =>
                                            t._id === task._id ? { ...t, description: e.target.value } : t
                                          ))}
                                          placeholder="Add a description..."
                                          className="w-full h-24 text-sm border-gray-200 rounded-md focus:border-black focus:ring-black"
                                        />
                                        <div className="flex justify-between items-center">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setShowDescription(null);
                                            }}
                                            className="text-sm text-gray-600 hover:text-gray-900"
                                          >
                                            <XMarkIcon className="h-4 w-4" />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingDescription(null);
                                            }}
                                            className="text-sm text-gray-600 hover:text-gray-900"
                                          >
                                            Done
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <p className="text-sm text-gray-600">
                                          {task.description || 'No description added'}
                                        </p>
                                        <div className="flex justify-between items-center">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setShowDescription(null);
                                            }}
                                            className="text-sm text-gray-600 hover:text-gray-900"
                                          >
                                            <XMarkIcon className="h-4 w-4" />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingDescription(task._id);
                                            }}
                                            className="text-sm text-gray-600 hover:text-gray-900"
                                          >
                                            {task.description ? 'Edit' : 'Add'}
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex-1">
                            <span className={`text-gray-900 ${task.completed ? 'line-through' : ''}`}>
                              {task.content}
                            </span>
                            <div className="flex items-center flex-wrap gap-2 text-sm text-gray-500 mt-1">
                              <span className="px-2 py-1 bg-gray-100 rounded-full">
                                {categories.find(c => c.id === task.category)?.name || task.category}
                              </span>
                              {task.dueDate && (
                                <span className="flex items-center">
                                  <CalendarIcon className="h-4 w-4 mr-1" />
                                  {task.dueDate.toLocaleString('en-US', {
                                    day: 'numeric',
                                    month: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => setTasks(tasks.filter(t => t._id !== task._id))}
                            className="text-gray-400 hover:text-red-500 ml-4"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Follow-up Tasks Section */}
          {followUpTasks.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Follow-up Tasks</h3>
              <div className="space-y-2">
                {followUpTasks.map((task) => (
                  <div
                    key={task._id}
                    className={`bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between transition-all duration-[1000ms] ease-in-out ${
                      fadingTasks.includes(task._id) ? 'opacity-0 transform translate-x-full' : 'opacity-100 transform translate-x-0'
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTaskComplete(task._id)}
                          className={`p-1 rounded-full transition-colors hover:bg-green-100 hover:text-green-600 ${
                            task.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setTasks(tasks.map(t => 
                            t._id === task._id ? { ...t, followUp: !t.followUp } : t
                          ))}
                          className="p-1 rounded-full bg-yellow-100 text-yellow-500"
                        >
                          <ExclamationCircleIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex-1">
                        <span className={`text-sm text-gray-900 ${task.completed ? 'line-through' : ''}`}>
                          {task.content}
                        </span>
                        <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500 mt-0.5">
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                            {categories.find(c => c.id === task.category)?.name || task.category}
                          </span>
                          {task.dueDate && (
                            <span className="flex items-center">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {task.dueDate.toLocaleString('en-US', {
                                day: 'numeric',
                                month: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setTasks(tasks.filter(t => t._id !== task._id))}
                        className="text-gray-400 hover:text-red-500 ml-3"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DragDropContext>
      </div>

      {/* Completed Tasks Modal */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ${showCompletedModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setShowCompletedModal(false)}
      >
        <div 
          className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg transition-transform duration-300 transform ${
            showCompletedModal ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{ height: '50vh' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Completed Tasks</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <div
                    key={task._id}
                    className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="text-gray-900 line-through">{task.content}</span>
                        <div className="flex items-center flex-wrap gap-2 text-sm text-gray-500 mt-1">
                          <span className="px-2 py-1 bg-gray-100 rounded-full">
                            {categories.find(c => c.id === task.category)?.name || task.category}
                          </span>
                          {task.dueDate && (
                            <span className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {task.dueDate.toLocaleString('en-US', {
                                day: 'numeric',
                                month: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setTasks(tasks.filter(t => t._id !== task._id))}
                        className="text-gray-400 hover:text-red-500 ml-4"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Show/Close Completed Tasks Button */}
      <button
        onClick={() => setShowCompletedModal(!showCompletedModal)}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors duration-200 flex items-center space-x-2"
      >
        <CheckIcon className="h-5 w-5" />
        <span>{showCompletedModal ? 'Close Completed Tasks' : 'Show Completed Tasks'}</span>
      </button>
    </main>
  );
} 