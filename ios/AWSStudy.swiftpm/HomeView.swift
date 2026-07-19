import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var store: ProgressStore
    private let questions = QuestionLoader.load()

    @State private var quizSession: QuizSession?
    @State private var showFlashcards = false
    @State private var showResetAlert = false

    private var categories: [String] {
        var seen = Set<String>()
        return questions.compactMap { seen.insert($0.category).inserted ? $0.category : nil }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    statRow
                    actionRow
                    Text("カテゴリ別に学ぶ")
                        .font(.headline)
                    categoryList
                }
                .padding()
            }
            .navigationTitle("☁️ AWS Study")
            .toolbar {
                if store.streak >= 2 {
                    ToolbarItem(placement: .topBarTrailing) {
                        Text("🔥 \(store.streak)")
                            .font(.subheadline.bold())
                            .foregroundStyle(.orange)
                    }
                }
            }
            .fullScreenCover(item: $quizSession) { session in
                QuizView(session: session)
            }
            .fullScreenCover(isPresented: $showFlashcards) {
                FlashcardView(questions: questions.shuffled())
            }
            .alert("学習進捗をすべてリセットします", isPresented: $showResetAlert) {
                Button("リセット", role: .destructive) { store.reset() }
                Button("キャンセル", role: .cancel) {}
            }
        }
    }

    private var statRow: some View {
        let answered = questions.filter { store.stats(for: $0.id).attempts > 0 }.count
        let weak = store.weakQuestions(in: questions).count
        return LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 4), spacing: 10) {
            StatTile(value: "\(answered)/\(questions.count)", label: "解答済み")
            StatTile(value: store.accuracyText(in: questions), label: "正答率")
            StatTile(value: "\(store.masteredCount(in: questions))", label: "習得済み")
            StatTile(value: "\(weak)", label: "要復習")
        }
    }

    private var actionRow: some View {
        VStack(spacing: 10) {
            Button {
                quizSession = QuizSession(questions: Array(questions.shuffled().prefix(10)), label: "ランダム10問")
            } label: {
                Label("ランダム10問に挑戦", systemImage: "play.fill")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)

            HStack(spacing: 10) {
                let weak = store.weakQuestions(in: questions)
                Button {
                    quizSession = QuizSession(questions: weak.shuffled(), label: "弱点復習")
                } label: {
                    Label("弱点復習 (\(weak.count))", systemImage: "arrow.triangle.2.circlepath")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .disabled(weak.isEmpty)

                Button {
                    showFlashcards = true
                } label: {
                    Label("カード", systemImage: "rectangle.on.rectangle.angled")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
            }

            Button("進捗リセット", role: .destructive) { showResetAlert = true }
                .font(.footnote)
                .frame(maxWidth: .infinity, alignment: .trailing)
        }
    }

    private var categoryList: some View {
        VStack(spacing: 10) {
            ForEach(categories, id: \.self) { category in
                let qs = questions.filter { $0.category == category }
                let done = qs.filter {
                    let p = store.stats(for: $0.id)
                    return p.correct > 0 && p.wrongStreak == 0
                }.count
                Button {
                    quizSession = QuizSession(questions: qs.shuffled(), label: category)
                } label: {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text(category).font(.subheadline.bold())
                            Spacer()
                            Text("\(done)/\(qs.count)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        ProgressView(value: Double(done), total: Double(qs.count))
                            .tint(.green)
                    }
                    .padding()
                    .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 14))
                }
                .buttonStyle(.plain)
            }
        }
    }
}

struct StatTile: View {
    let value: String
    let label: String

    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.title3.bold())
                .foregroundStyle(.orange)
                .minimumScaleFactor(0.6)
                .lineLimit(1)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 12))
    }
}
