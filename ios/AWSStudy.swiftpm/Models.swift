import Foundation
import SwiftUI

// MARK: - データモデル(data/questions.json と同一スキーマ)

struct QuizData: Codable {
    let version: Int
    let updatedAt: String
    let questions: [Question]
}

struct Question: Codable, Identifiable, Hashable {
    let id: String
    let category: String
    let level: Int
    let question: String
    let choices: [String]
    let answer: Int
    let explanation: String
}

enum QuestionLoader {
    static func load() -> [Question] {
        guard let url = Bundle.main.url(forResource: "questions", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let quiz = try? JSONDecoder().decode(QuizData.self, from: data)
        else {
            assertionFailure("questions.json の読み込みに失敗。scripts/sync-questions.sh を実行したか確認すること")
            return []
        }
        return quiz.questions
    }
}

// MARK: - 進捗ストア(UserDefaults 永続化・端末内のみ)

struct QuestionProgress: Codable {
    var attempts = 0
    var correct = 0
    var wrongStreak = 0
}

@MainActor
final class ProgressStore: ObservableObject {
    @Published private(set) var progress: [String: QuestionProgress] = [:]
    @Published private(set) var streak = 0

    private let progressKey = "awsstudy.progress.v1"
    private let streakKey = "awsstudy.streak.v1"

    init() {
        if let data = UserDefaults.standard.data(forKey: progressKey),
           let saved = try? JSONDecoder().decode([String: QuestionProgress].self, from: data) {
            progress = saved
        }
        streak = UserDefaults.standard.integer(forKey: streakKey)
    }

    func stats(for id: String) -> QuestionProgress {
        progress[id] ?? QuestionProgress()
    }

    func record(id: String, isCorrect: Bool) {
        var p = stats(for: id)
        p.attempts += 1
        if isCorrect {
            p.correct += 1
            p.wrongStreak = 0
            streak += 1
        } else {
            p.wrongStreak += 1
            streak = 0
        }
        progress[id] = p
        save()
    }

    func reset() {
        progress = [:]
        streak = 0
        save()
    }

    /// 要復習 = 直近で間違えたまま正解し直していない問題
    func weakQuestions(in all: [Question]) -> [Question] {
        all.filter { stats(for: $0.id).wrongStreak > 0 }
    }

    /// 習得済み = 2回以上正解し、直近も正解している問題
    func masteredCount(in all: [Question]) -> Int {
        all.filter { let p = stats(for: $0.id); return p.correct >= 2 && p.wrongStreak == 0 }.count
    }

    func accuracyText(in all: [Question]) -> String {
        let attempts = all.reduce(0) { $0 + stats(for: $1.id).attempts }
        let corrects = all.reduce(0) { $0 + stats(for: $1.id).correct }
        guard attempts > 0 else { return "–" }
        return "\(Int((Double(corrects) / Double(attempts) * 100).rounded()))%"
    }

    private func save() {
        if let data = try? JSONEncoder().encode(progress) {
            UserDefaults.standard.set(data, forKey: progressKey)
        }
        UserDefaults.standard.set(streak, forKey: streakKey)
    }
}
