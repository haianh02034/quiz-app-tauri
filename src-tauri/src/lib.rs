use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use rand::seq::SliceRandom;
use rand::thread_rng;
use tauri::Manager;

// Embed quiz.json directly into the binary
const QUIZ_JSON_DATA: &str = include_str!("../../quiz.json");

// Define data structures mirroring quiz.json
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct QuizOption {
    pub id: String,
    pub text: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Question {
    pub id: String,
    pub text: String, // Changed from question_text to text
    pub options: Vec<QuizOption>,
    pub correct_option_ids: Vec<String>,
    pub explanation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct QuizData {
    pub title: String,
    // Removed description field as it's not in quiz.json
    pub questions: Vec<Question>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubmitAnswersPayload {
    pub answers: HashMap<String, Vec<String>>,
    pub total_questions: usize,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuestionResult {
    pub question_id: String,
    pub is_correct: bool,
    pub correct_option_ids: Vec<String>,
    pub submitted_answers: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubmitResult {
    pub score: usize,
    pub total_questions: usize,
    pub percentage_correct: String,
    pub results: Vec<QuestionResult>,
}

// Command to get all quiz data
#[tauri::command]
fn get_quiz_data() -> Result<QuizData, String> {
    let quiz_data: QuizData = serde_json::from_str(QUIZ_JSON_DATA)
        .map_err(|e| format!("Failed to parse embedded quiz.json: {}", e))?;
    Ok(quiz_data)
}

// Command to get a specified number of random quiz questions
#[tauri::command]
fn get_random_quiz_data(count: usize) -> Result<QuizData, String> {
    let mut quiz_data = get_quiz_data()?;
    
    if count == 0 {
        return Ok(QuizData {
            title: quiz_data.title,
            questions: vec![],
        });
    }

    let mut rng = thread_rng();
    quiz_data.questions.shuffle(&mut rng);
    let selected_questions = quiz_data.questions.into_iter().take(count).collect();

    Ok(QuizData {
        title: quiz_data.title,
        questions: selected_questions,
    })
}

// Command to submit answers and get results
#[tauri::command]
fn submit_answers(answers: HashMap<String, Vec<String>>, total_questions: usize) -> Result<SubmitResult, String> {
    let quiz_data = get_quiz_data()?;
    let mut score = 0;
    let mut results: Vec<QuestionResult> = Vec::new();

    let question_map: HashMap<String, &Question> = quiz_data.questions
        .iter()
        .map(|q| (q.id.clone(), q))
        .collect();

    for (question_id, submitted_options) in answers { // Use 'answers' directly
        let question = match question_map.get(&question_id) {
            Some(q) => q,
            None => {
                eprintln!("Question with ID {} not found in quizData.", question_id);
                continue;
            }
        };

        let correct_option_ids: HashSet<String> = question.correct_option_ids.iter().cloned().collect();
        let submitted_options_set: HashSet<String> = submitted_options.iter().cloned().collect();

        let is_multiple_choice_question = correct_option_ids.len() > 1;

        let mut is_correct = false;
        if is_multiple_choice_question {
            if correct_option_ids.len() == submitted_options_set.len() {
                is_correct = submitted_options_set.iter().all(|opt_id| correct_option_ids.contains(opt_id));
            }
        } else {
            if submitted_options_set.len() == 1 && correct_option_ids.len() == 1 {
                is_correct = submitted_options_set.contains(correct_option_ids.iter().next().unwrap());
            }
        }

        if is_correct {
            score += 1;
        }

        results.push(QuestionResult {
            question_id: question.id.clone(),
            is_correct,
            correct_option_ids: question.correct_option_ids.clone(),
            submitted_answers: submitted_options,
        });
    }

    let percentage_correct = if total_questions > 0 { // Use 'total_questions' directly
        format!("{:.2}", (score as f64 / total_questions as f64) * 100.0)
    } else {
        "0.00".to_string()
    };

    Ok(SubmitResult {
        score,
        total_questions, // Use 'total_questions' directly
        percentage_correct,
        results,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_quiz_data,
            get_random_quiz_data,
            submit_answers
        ])
        .setup(|app| {
            #[cfg(debug_assertions)] // only enable devtools in debug builds
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, event| match event {
            tauri::RunEvent::ExitRequested { api, .. } => {
                api.prevent_exit();
            }
            _ => {}
        });
}
