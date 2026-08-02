import SwiftUI
import WebKit

// MARK: - 図解の読み込み
//
// 図解は scripts/build-diagrams.py が事前生成した SVG(Resources/diagrams/<問題ID>.svg)。
// SwiftUI は SVG を直接描画できないため、WKWebView にマークアップを埋め込んで表示する。
// 全問に図解があるわけではないので、無い問題では何も表示しない。

@MainActor
enum DiagramLoader {
    struct Diagram {
        let markup: String
        let aspectRatio: CGFloat  // 幅 / 高さ
    }

    private struct Index: Decodable {
        let questionIds: [String]
    }

    /// 図解を持つ問題ID(Resources/diagram-index.json・build-diagrams.py が生成)。
    /// 全400問のうち図解があるのは一部なので、ホームの「図解つき問題」導線でこれを使う。
    static let questionIDsWithDiagram: Set<String> = {
        guard let url = Bundle.main.url(forResource: "diagram-index", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let index = try? JSONDecoder().decode(Index.self, from: data)
        else { return [] }
        return Set(index.questionIds)
    }()

    private static var cache: [String: Diagram?] = [:]

    static func diagram(for questionID: String) -> Diagram? {
        if let cached = cache[questionID] { return cached }
        let loaded = load(questionID)
        cache[questionID] = loaded
        return loaded
    }

    private static func load(_ questionID: String) -> Diagram? {
        let url = Bundle.main.url(forResource: questionID, withExtension: "svg", subdirectory: "diagrams")
            ?? Bundle.main.url(forResource: questionID, withExtension: "svg")
        guard let url, let markup = try? String(contentsOf: url, encoding: .utf8) else { return nil }
        return Diagram(markup: markup, aspectRatio: aspectRatio(of: markup) ?? 1.6)
    }

    /// viewBox="0 0 幅 高さ" から縦横比を読む(取れなければ呼び出し側の既定値を使う)
    private static func aspectRatio(of markup: String) -> CGFloat? {
        guard let start = markup.range(of: "viewBox=\"") else { return nil }
        let rest = markup[start.upperBound...]
        guard let end = rest.firstIndex(of: "\"") else { return nil }
        let values = rest[..<end].split(separator: " ").compactMap { Double($0) }
        guard values.count == 4, values[2] > 0, values[3] > 0 else { return nil }
        return CGFloat(values[2] / values[3])
    }
}

// MARK: - 表示

struct DiagramCard: View {
    let questionID: String

    var body: some View {
        if let diagram = DiagramLoader.diagram(for: questionID) {
            VStack(alignment: .leading, spacing: 6) {
                Label("図解 — 判断の分かれ目", systemImage: "rectangle.3.group")
                    .font(.caption.bold())
                    .foregroundStyle(.secondary)
                SVGWebView(markup: diagram.markup)
                    .aspectRatio(diagram.aspectRatio, contentMode: .fit)
                    .frame(maxWidth: .infinity)
                    .background(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color.secondary.opacity(0.25), lineWidth: 1)
                    )
                    .accessibilityLabel("解答の判断構造を示した図解")
            }
        }
    }
}

/// SVG マークアップをそのまま埋め込んだ HTML を表示する。
/// ファイル参照ではなく埋め込みにしているのは、loadHTMLString では file:// のサブリソースを読めないため。
private struct SVGWebView: UIViewRepresentable {
    let markup: String

    func makeUIView(context: Context) -> WKWebView {
        let webView = WKWebView()
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.isScrollEnabled = false  // 縦スクロールは親の ScrollView に任せる
        webView.loadHTMLString(html, baseURL: nil)
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    private var html: String {
        """
        <!doctype html>
        <html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          html, body { margin: 0; padding: 0; background: #ffffff; }
          svg { display: block; width: 100%; height: auto; }
        </style>
        </head><body>\(markup)</body></html>
        """
    }
}
