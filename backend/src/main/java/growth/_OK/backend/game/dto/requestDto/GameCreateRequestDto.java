package growth._OK.backend.game.dto.requestDto;

import growth._OK.backend.game.domain.GameType;
import growth._OK.backend.game.domain.ProblemType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class GameCreateRequestDto {
    private final GameType type;
    private final String title;
    private final String description;
    private final String learningObjectives;
    private final Boolean isPublic;
    // 허용 문제 유형 (단답형, O/X, 5지선다). 비어 있으면 전체 허용
    private final List<ProblemType> problemTypes;
    // 문제 개수. null이거나 0 이하면 기본 10개
    private final Integer problemCount;
    // 이 게임에 연결할 소스 ID (업로드한 PDF/텍스트). 지정 시 문제 생성 시 해당 소스 사용
    private final Long sourceId;
}
